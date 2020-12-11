import {
  ColonyClient,
  FundingPotAssociatedType,
  getBlockTime,
  getLogs,
} from '@colony/colony-js';
import { bigNumberify } from 'ethers/utils';
import { HashZero } from 'ethers/constants';
import { Resolvers } from '@apollo/client';

import { Transfer, NetworkEvent } from '~data/index';
import { notUndefined } from '~utils/arrays';
import { Context } from '~context/index';

interface ParsedLog {
  name: string;
  signature: string;
  topic: string;
  values: Record<string, any>;
}

export const getColonyAllEvents = async (
  colonyClient: ColonyClient,
): Promise<NetworkEvent[]> => {
  const { provider, filters } = colonyClient;

  const eventFilters = Object.keys(filters).filter((key) => !key.includes('('));

  const allEventsLogs = await eventFilters.reduce(async (acc, filter) => {
    const logs = await getLogs(colonyClient, colonyClient.filters[filter]());
    return [...(await acc), ...logs];
  }, Promise.resolve([]));

  const events = await Promise.all(
    allEventsLogs.map(async (log) => {
      const event = colonyClient.interface.parseLog(log);
      const date = log.blockHash
        ? await getBlockTime(provider, log.blockHash)
        : 0;

      const {
        values: { user, domainId },
      } = event;

      // eslint-disable-next-line no-underscore-dangle
      const domain = domainId ? bigNumberify(domainId._hex).toString() : null;

      const tx = log.transactionHash
        ? await provider.getTransaction(log.transactionHash)
        : undefined;

      return {
        __typename: 'NetworkEvent',
        ...event,
        createdAt: date,
        fromAddress: (tx && tx.from) || null,
        hash: log.transactionHash || HashZero,
        toAddress: colonyClient.address,
        domainId: domain,
        userAddress: user || null,
      };
    }),
  );

  return events;
};

export const getColonyFundsClaimedTransfers = async (
  colonyClient: ColonyClient,
): Promise<Transfer[]> => {
  const { provider } = colonyClient;

  const filter = colonyClient.filters.ColonyFundsClaimed(null, null, null);
  const logs = await getLogs(colonyClient, filter);

  const transfers = await Promise.all(
    logs.map(async (log) => {
      const event = colonyClient.interface.parseLog(log);
      const date = log.blockHash
        ? await getBlockTime(provider, log.blockHash)
        : 0;
      const {
        values: { token, payoutRemainder },
      } = event;

      const tx = log.transactionHash
        ? await provider.getTransaction(log.transactionHash)
        : undefined;

      // Don't show claims of zero
      if (!payoutRemainder.gt(bigNumberify(0))) return undefined;

      return {
        __typename: 'Transfer',
        amount: payoutRemainder.toString(),
        colonyAddress: colonyClient.address,
        date,
        from: (tx && tx.from) || null,
        hash: log.transactionHash || HashZero,
        incoming: true,
        to: colonyClient.address,
        token,
      };
    }),
  );

  return transfers.filter(notUndefined);
};

export const getPayoutClaimedTransfers = async (
  colonyClient: ColonyClient,
): Promise<Transfer[]> => {
  const { provider } = colonyClient;
  const filter = colonyClient.filters.PayoutClaimed(null, null, null);
  const logs = await getLogs(colonyClient, filter);

  const transfers = await Promise.all(
    logs.map(async (log) => {
      const event = colonyClient.interface.parseLog(log);
      const date = log.blockHash
        ? await getBlockTime(provider, log.blockHash)
        : 0;
      const {
        values: { fundingPotId, token, amount },
      } = event;

      const {
        associatedType,
        associatedTypeId,
      } = await colonyClient.getFundingPot(fundingPotId);

      if (associatedType !== FundingPotAssociatedType.Payment) return undefined;

      const { recipient: to } = await colonyClient.getPayment(associatedTypeId);

      return {
        __typename: 'Transfer',
        amount: amount.toString(),
        colonyAddress: colonyClient.address,
        date,
        from: null,
        hash: log.transactionHash || HashZero,
        incoming: false,
        to,
        token,
      };
    }),
  );

  return transfers.filter(notUndefined);
};

export const getColonyUnclaimedTransfers = async (
  colonyClient: ColonyClient,
): Promise<Transfer[]> => {
  const { provider } = colonyClient;
  const { tokenClient } = colonyClient;
  const claimedTransferFilter = colonyClient.filters.ColonyFundsClaimed(
    null,
    null,
    null,
  );
  const claimedTransferLogs = await getLogs(
    colonyClient,
    claimedTransferFilter,
  );
  const claimedTransferEvents = claimedTransferLogs.map((log) =>
    colonyClient.interface.parseLog(log),
  );

  // Get logs & events for token transfer to this colony
  const tokenTransferFilter = tokenClient.filters.Transfer(
    null,
    colonyClient.address,
    null,
  );
  const tokenTransferLogs = await getLogs(colonyClient, {
    // Do not limit it to the tokenClient. We want all transfers to the colony
    topics: tokenTransferFilter.topics,
  });

  const transfers = await Promise.all(
    tokenTransferLogs.map(async (log) => {
      const event = tokenClient.interface.parseLog(log);
      const date = log.blockHash
        ? await getBlockTime(provider, log.blockHash)
        : 0;
      const {
        values: { src, wad },
      } = event;
      const { blockNumber } = log;

      const transferClaimed = !!claimedTransferEvents.find(
        ({ values: { token } }, i) =>
          token === log.address &&
          blockNumber &&
          claimedTransferLogs &&
          claimedTransferLogs[i] &&
          claimedTransferLogs[i].blockNumber &&
          // blockNumber is defined (we just checked that), only TS doesn't know that for some reason
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          claimedTransferLogs[i].blockNumber! > blockNumber,
      );

      if (transferClaimed) return undefined;

      return {
        __typename: 'Transfer',
        amount: wad.toString(),
        colonyAddress: colonyClient.address,
        date,
        from: src || null,
        hash: log.transactionHash || HashZero,
        incoming: true,
        to: colonyClient.address,
        token: log.address,
      };
    }),
  );

  return transfers.filter(notUndefined);
};

export const transactionResolvers = ({
  colonyManager: { networkClient },
}: Required<Context>): Resolvers => ({
  Query: {
    async transaction(_, { transactionHash, colonyAddress }) {
      const { provider } = networkClient;
      const colonyClient = await networkClient.getColonyClient(colonyAddress);

      /*
       * Try to get the transaction receipt. If the transaction is mined, you'll
       * get a return from this call, otherwise, it's null.
       */
      const transactionReceipt = await provider.getTransactionReceipt(
        transactionHash,
      );

      if (transactionReceipt) {
        const {
          transactionHash: hash,
          from,
          to,
          status,
          logs,
          blockHash,
        } = transactionReceipt;
        /*
         * Get the block time in ms
         *
         * If we don't find a time for the current tx (which shouldn't happen actually)
         * we fallback to 0, which is 1/1/1970 :)
         */
        const createdAt = blockHash
          ? await getBlockTime(provider, blockHash)
          : 0;
        const events = logs
          ?.map((log) => colonyClient.interface.parseLog(log))
          /*
           * If the above parser find events that are not part of the colony client
           * it will return them as `null` so we filter them out
           */
          .filter((log) => !!log)
          .map(({ name, values, topic }) => ({
            from,
            name,
            values,
            topic,
            createdAt,
          }));
        return {
          hash,
          from,
          to,
          status,
          events,
          createdAt,
        };
      }

      /*
       * If we don't have a receipt, just get the transaction
       * This means the transaction is currently mining, so we mark it as "pending"
       *
       * We won't have logs until the transaction is mined, so that means we need to
       * add the transaction as "Unknown"
       *
       * Maybe we should inferr something from whether or not the `from` or `to`
       * addressses have a user profile created. But that might be error prone.
       */
      const { hash, from, to } = await provider.getTransaction(transactionHash);

      return {
        hash,
        from,
        to,
        status: 2,
        events: null,
        /*
         * Since this is a pending transaction, and we can't get the blockHash anyway,
         * we just set it to "now" as that is mostly true anyway (unless the tx takes
         * a very long time to mine) -- but this is a limitation of operating w/o a
         * server
         */
        createdAt: Date.now(),
      };
    },
  },
});
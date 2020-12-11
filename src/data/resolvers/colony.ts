import { Resolvers } from '@apollo/client';
import { AddressZero, HashZero } from 'ethers/constants';
import { bigNumberify } from 'ethers/utils';
import {
  ClientType,
  ColonyVersion,
  getColonyRoles,
  TokenClientType,
} from '@colony/colony-js';

import ENS from '~lib/ENS';
import { Address } from '~types/index';
import { Context } from '~context/index';
import {
  Transfer,
  NetworkEvent,
  ColonySubscribedUsersQuery,
  ColonySubscribedUsersQueryVariables,
  ColonySubscribedUsersDocument,
} from '~data/index';
import ColonyManager from '~lib/ColonyManager';
import { COLONY_TOTAL_BALANCE_DOMAIN_ID } from '~constants';

import { getToken } from './token';
import {
  getColonyFundsClaimedTransfers,
  getPayoutClaimedTransfers,
  getColonyUnclaimedTransfers,
  getColonyAllEvents,
} from './transactions';

type ReputationOracleAddresses = Address[];

const getColonyMembersWithReputation = async (
  colonyManager: ColonyManager,
  colonyAddress: Address,
  domainId: number,
): Promise<ReputationOracleAddresses> => {
  const colonyClient = await colonyManager.getClient(
    ClientType.ColonyClient,
    colonyAddress,
  );
  const { skillId } = await colonyClient.getDomain(domainId);
  /*
   * @TODO This is coming from colonyJS as I forgot to adjust the proper types when
   * creating this common extension.
   * I'll put in a PR to fix this at some point
   */
  // @ts-ignore
  const { addresses } = await colonyClient.getMembersReputation(skillId);
  return addresses || [];
};

export const colonyResolvers = ({
  colonyManager: { networkClient },
  colonyManager,
  ens,
  apolloClient,
}: Required<Context>): Resolvers => ({
  Query: {
    async colonyAddress(_, { name }) {
      try {
        const address = await ens.getAddress(
          ENS.getFullDomain('colony', name),
          networkClient,
        );
        return address;
      } catch (error) {
        /*
         * @NOTE This makes the server query fail in case of an unexistent/unregistered colony ENS name
         *
         * Otherwise, the ENS resolution will fail, but not this query.
         * This will then not proceed further to the server query and the data
         * will try to load indefinitely w/o an error
         */
        return error;
      }
    },
    async colonyName(_, { address }) {
      const domain = await ens.getDomain(address, networkClient);
      return ENS.stripDomainParts('colony', domain);
    },
    async colonyMembersWithReputation(
      _,
      {
        colonyAddress,
        domainId = COLONY_TOTAL_BALANCE_DOMAIN_ID,
      }: { colonyAddress: Address; domainId: number },
    ) {
      if (domainId === COLONY_TOTAL_BALANCE_DOMAIN_ID) {
        const subscribedMembers = await apolloClient.query<
          ColonySubscribedUsersQuery,
          ColonySubscribedUsersQueryVariables
        >({
          query: ColonySubscribedUsersDocument,
          variables: {
            colonyAddress,
          },
        });
        return subscribedMembers.data?.colony.subscribedUsers.map(
          ({ profile: { walletAddress } }) => walletAddress,
        );
      }
      /*
       * @NOTE About zero reputation an decay
       *
       * Initially a user has 0 reputation in the colony.
       * By default that user won't be returned in the below query.
       *
       * Let say that then, a user aquires some reputation, which, after a time, decays back to zero.
       * That user will be returned in the below query.
       *
       * Maybe at some point we want to consider filtering them out.
       * But that's for another time.
       */
      return getColonyMembersWithReputation(
        colonyManager,
        colonyAddress,
        domainId,
      );
    },
  },
  Colony: {
    async canMintNativeToken({ colonyAddress }) {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );
      // fetch whether the user is allowed to mint tokens via the colony
      let canMintNativeToken = true;
      try {
        await colonyClient.estimate.mintTokens(bigNumberify(1));
      } catch (error) {
        canMintNativeToken = false;
      }
      return canMintNativeToken;
    },
    async isInRecoveryMode({ colonyAddress }) {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );
      return colonyClient.isInRecoveryMode();
    },
    async isNativeTokenLocked({ colonyAddress }) {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );
      let isNativeTokenLocked: boolean;
      try {
        const locked = await colonyClient.tokenClient.locked();
        isNativeTokenLocked = locked;
      } catch (error) {
        isNativeTokenLocked = false;
      }
      return isNativeTokenLocked;
    },
    async nativeToken({ nativeTokenAddress }, _, { client }) {
      return getToken({ colonyManager, client }, nativeTokenAddress);
    },
    async tokens(
      { tokenAddresses }: { tokenAddresses: Address[] },
      _,
      { client },
    ) {
      return Promise.all(
        ['0x0', ...tokenAddresses].map((tokenAddress) =>
          getToken({ colonyManager, client }, tokenAddress),
        ),
      );
    },
    async canUnlockNativeToken({ colonyAddress }) {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );
      const { tokenClient } = colonyClient;
      if (tokenClient.tokenClientType === TokenClientType.Colony) {
        try {
          await tokenClient.estimate.unlock();
        } catch (error) {
          return false;
        }
        return true;
      }
      return false;
    },
    async roles({ colonyAddress }) {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );

      if (colonyClient.clientVersion === ColonyVersion.GoerliGlider) {
        throw new Error(`Not supported in this version of Colony`);
      }

      const roles = await getColonyRoles(colonyClient);
      return roles.map((userRoles) => ({
        ...userRoles,
        domains: userRoles.domains.map((domainRoles) => ({
          ...domainRoles,
          __typename: 'DomainRoles',
        })),
        __typename: 'UserRoles',
      }));
    },
    async events({ colonyAddress }): Promise<NetworkEvent[]> {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );

      const events = await getColonyAllEvents(colonyClient);

      return events;
    },
    async transfers({ colonyAddress }): Promise<Transfer[]> {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );

      // eslint-disable-next-line max-len
      const colonyFundsClaimedTransactions = await getColonyFundsClaimedTransfers(
        colonyClient,
      );

      const payoutClaimedTransactions = await getPayoutClaimedTransfers(
        colonyClient,
      );

      return [
        ...colonyFundsClaimedTransactions,
        ...payoutClaimedTransactions,
      ].sort((a, b) => b.date - a.date);
    },
    async unclaimedTransfers({ colonyAddress }): Promise<Transfer[]> {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );

      // eslint-disable-next-line max-len
      const colonyUnclaimedTransfers = await getColonyUnclaimedTransfers(
        colonyClient,
      );

      // Get ether balance and add a fake transaction if there's any unclaimed
      const colonyEtherBalance = await colonyClient.provider.getBalance(
        colonyAddress,
      );
      // eslint-disable-next-line max-len
      const colonyNonRewardsPotsTotal = await colonyClient.getNonRewardPotsTotal(
        AddressZero,
      );
      const colonyRewardsPotTotal = await colonyClient.getFundingPotBalance(
        0,
        AddressZero,
      );

      const unclaimedEther = colonyEtherBalance
        .sub(colonyNonRewardsPotsTotal)
        .sub(colonyRewardsPotTotal);

      if (unclaimedEther.gt(0)) {
        colonyUnclaimedTransfers.push({
          // @ts-ignore
          __typename: 'Transfer',
          amount: unclaimedEther.toString(),
          colonyAddress,
          date: new Date().getTime(),
          from: AddressZero,
          hash: HashZero,
          incoming: true,
          to: colonyClient.address,
          token: AddressZero,
        });
      }

      return colonyUnclaimedTransfers;
    },
    async version({ colonyAddress }) {
      const colonyClient = await colonyManager.getClient(
        ClientType.ColonyClient,
        colonyAddress,
      );
      const version = await colonyClient.version();
      return version.toString();
    },
  },
});
/* @flow */

import { fromJS } from 'immutable';
import getObjectFromPath from 'lodash/get';

import type { CoreTransactionsRecord, TransactionRecordType } from '~immutable';

import { TransactionRecord, CoreTransactions } from '~immutable';
import { ACTIONS } from '~redux';

import { CORE_GAS_PRICES, CORE_TRANSACTIONS_LIST } from '../constants';
import type { ReducerType } from '~redux';

/*
 * Helpers for transaction transformations
 */
const transactionGroup = (tx: TransactionRecordType<*, *>) => {
  if (!tx.group || typeof tx.group.id == 'string') return tx.group;
  const id = tx.group.id.reduce(
    (resultId, entry) => `${resultId}-${getObjectFromPath(tx, entry)}`,
    tx.group.key,
  );
  return {
    ...tx.group,
    id,
  };
};

const coreTransactionsReducer: ReducerType<
  CoreTransactionsRecord,
  {|
    GAS_PRICES_UPDATE: *,
    MULTISIG_TRANSACTION_CREATED: *,
    MULTISIG_TRANSACTION_REFRESHED: *,
    TRANSACTION_ADD_PROPERTIES: *,
    TRANSACTION_CANCEL: *,
    TRANSACTION_CREATED: *,
    TRANSACTION_ERROR: *,
    TRANSACTION_SUCCEEDED: *,
    TRANSACTION_GAS_UPDATE: *,
    TRANSACTION_RECEIPT_RECEIVED: *,
    TRANSACTION_SENT: *,
  |},
> = (state = CoreTransactions(), action) => {
  switch (action.type) {
    case ACTIONS.TRANSACTION_CREATED:
    case ACTIONS.MULTISIG_TRANSACTION_CREATED: {
      const {
        meta: { id },
        payload: {
          context,
          createdAt,
          from,
          identifier,
          lifecycle,
          methodName,
          multisig,
          options,
          params,
          status,
        },
      } = action;

      const tx = TransactionRecord({
        context,
        createdAt,
        from,
        id,
        identifier,
        lifecycle,
        methodName,
        multisig,
        options,
        params,
        status,
      });

      return state.setIn(
        [CORE_TRANSACTIONS_LIST, id],
        tx.set('group', transactionGroup(tx)),
      );
    }
    case ACTIONS.TRANSACTION_ADD_PROPERTIES: {
      const { id } = action.meta;
      return state.mergeIn(
        [CORE_TRANSACTIONS_LIST, id],
        fromJS({ ...action.payload, status: 'ready' }),
      );
    }
    case ACTIONS.MULTISIG_TRANSACTION_REFRESHED: {
      const {
        meta: { id },
        payload,
      } = action;
      return state.mergeIn([CORE_TRANSACTIONS_LIST, id], fromJS(payload));
    }
    case ACTIONS.TRANSACTION_GAS_UPDATE: {
      const {
        meta: { id },
        payload,
      } = action;
      return state.mergeIn([CORE_TRANSACTIONS_LIST, id], fromJS(payload));
      // TODO: do we want an 'estimated' state for TX?
    }
    case ACTIONS.TRANSACTION_SENT: {
      const {
        meta: { id },
        payload: { hash },
      } = action;
      return state.mergeIn(
        [CORE_TRANSACTIONS_LIST, id],
        fromJS({
          hash,
          status: 'pending',
        }),
      );
    }
    case ACTIONS.TRANSACTION_RECEIPT_RECEIVED: {
      const {
        meta: { id },
        payload: { receipt },
      } = action;
      return state.mergeIn(
        [CORE_TRANSACTIONS_LIST, id],
        fromJS({
          receipt,
        }),
      );
    }
    case ACTIONS.TRANSACTION_SUCCEEDED: {
      const {
        meta: { id },
        payload: { eventData },
      } = action;
      return state.mergeIn(
        [CORE_TRANSACTIONS_LIST, id],
        fromJS({
          eventData,
          status: 'succeeded',
        }),
      );
    }
    case ACTIONS.TRANSACTION_ERROR: {
      const {
        meta: { id },
        payload: error,
      } = action;
      return state
        .updateIn([CORE_TRANSACTIONS_LIST, id, 'errors'], errors =>
          errors.push(error),
        )
        .setIn([CORE_TRANSACTIONS_LIST, id, 'status'], 'failed');
    }
    case ACTIONS.TRANSACTION_CANCEL: {
      const {
        meta: { id },
      } = action;
      const tx = state.list.get(id);
      if (!tx) return state;
      if (tx.group) {
        return state.update(CORE_TRANSACTIONS_LIST, list =>
          list.filter(filterTx => {
            // Keep all transactions with no group
            if (!filterTx.group) return true;
            // Keep all transactions with a different groupId
            if (!filterTx.group.id !== tx.group.id) return true;
            // Keep all transactions with the same groupId but a lower index
            if (filterTx.group.index < tx.group.index) return true;
            return false;
          }),
        );
      }
      return state.deleteIn([CORE_TRANSACTIONS_LIST, id]);
    }
    case ACTIONS.GAS_PRICES_UPDATE:
      return state.mergeIn([CORE_GAS_PRICES], fromJS(action.payload));
    default:
      return state;
  }
};

export default coreTransactionsReducer;

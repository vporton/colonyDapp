import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import Button from '~core/Button';
import { Colony, LoggedInUser } from '~data/index';
import { ValuesType } from '~pages/ExpenditurePage/types';
import { Staged } from '~dashboard/ExpenditurePage/Staged/types';
import { Batch } from '~dashboard/ExpenditurePage/Batch/types';
import { FormSection } from '~core/Fields';
import Icon from '~core/Icon';

import ChangeItem from '../ChangedMultiple/ChangeItem';
import ChangeHeader from '../ChangedMultiple/ChangeHeader';
import NewRecipient from '../NewRecipient';

import { isRecipientType } from './utils';
import styles from './ChangedSplit.css';

export const MSG = defineMessages({
  discard: {
    id: 'dashboard.EditExpenditureDialog.ChangedSplit.discard',
    defaultMessage: 'Discard',
  },
  change: {
    id: 'dashboard.EditExpenditureDialog.ChangedSplit.change',
    defaultMessage: 'Change Split',
  },
  from: {
    id: 'dashboard.EditExpenditureDialog.ChangedSplit.from',
    defaultMessage: 'From',
  },
  to: {
    id: 'dashboard.EditExpenditureDialog.ChangedSplit.to',
    defaultMessage: 'To',
  },
  removed: {
    id: 'dashboard.EditExpenditureDialog.ChangedSplit.removed',
    defaultMessage: 'Recipient has been deleted',
  },
});

const displayName = 'dashboard.EditExpenditureDialog.ChangedSplit';
const skip = ['id', 'claimDate', 'isExpanded', 'created', 'percent', 'unequal'];

export type NewValueType = {
  id: string;
  key: string;
  value?:
    | ValuesType['recipients']
    | string
    | Staged
    | Pick<
        LoggedInUser,
        'walletAddress' | 'balance' | 'username' | 'ethereal' | 'networkId'
      >
    | Batch;
};

interface Props {
  newValues?: NewValueType;
  colony: Colony;
  oldValues: ValuesType;
  discardChange: (name: string) => void;
}

const ChangedSplit = ({
  newValues,
  oldValues,
  colony,
  discardChange,
}: Props) => {
  if (!newValues) {
    return null;
  }

  return (
    <>
      {typeof newValues?.value === 'object' &&
        Object.entries(newValues.value)
          .filter(([key, value]) => {
            return !(skip.includes(key) || Array.isArray(value));
          })
          .map(([key, value]) => {
            const oldValue = oldValues[newValues.key]?.[key]; // oldValue is a split.amount or split.recipients

            return (
              <>
                <FormSection appearance={{ border: 'bottom' }}>
                  <div className={styles.changeContainer}>
                    <FormattedMessage
                      {...MSG.change}
                      values={{
                        name: key,
                      }}
                    />
                  </div>
                  <div className={styles.subheader}>
                    <span>
                      <FormattedMessage {...MSG.from} />
                    </span>
                    <span>
                      <FormattedMessage {...MSG.to} />
                    </span>
                  </div>
                </FormSection>
                <ChangeItem
                  newValue={value}
                  oldValue={oldValue}
                  key={value.id}
                  colony={colony}
                  name={key}
                />
              </>
            );
          })}
      {typeof newValues?.value === 'object' &&
        Object.entries(newValues.value)
          .filter(([key, value]) => {
            return !skip.includes(key) && Array.isArray(value);
          })
          .map(([key, value]) => {
            const oldValue = oldValues[newValues.key]?.[key]; // oldValue is a split.amount or split.recipients

            return (
              <>
                {value.map((changeItem, idx) => {
                  // changeItem is split.recipient
                  if (!isRecipientType(changeItem)) {
                    return null;
                  }
                  const oldRecipienet = oldValue.find(
                    (rec) => rec.id === changeItem.id,
                  );

                  return (
                    <>
                      <ChangeHeader name={key} index={idx} />
                      {Object.entries(changeItem).map(
                        ([recipientKey, recipientValue], index) => {
                          // recipientKey - 'user', 'amount', 'id'
                          if (skip.includes(recipientKey)) {
                            return null;
                          }

                          if (recipientKey === 'removed') {
                            return (
                              <div className={styles.row}>
                                <NewRecipient newValue={oldRecipienet.user} />
                                <Icon
                                  name="arrow-right"
                                  className={styles.arrowIcon}
                                />
                                <span className={styles.right}>
                                  <FormattedMessage {...MSG.removed} />
                                </span>
                              </div>
                            );
                          }

                          return (
                            <ChangeItem
                              newValue={recipientValue}
                              oldValue={oldRecipienet?.[recipientKey]}
                              key={recipientValue.id || index}
                              colony={colony}
                              name={recipientKey}
                            />
                          );
                        },
                      )}
                    </>
                  );
                })}
              </>
            );
          })}
      <div className={styles.buttonWrappper}>
        <Button
          className={styles.discard}
          onClick={() => discardChange(newValues?.key || '')}
          text={MSG.discard}
        />
      </div>
    </>
  );
};

ChangedSplit.displayName = displayName;

export default ChangedSplit;

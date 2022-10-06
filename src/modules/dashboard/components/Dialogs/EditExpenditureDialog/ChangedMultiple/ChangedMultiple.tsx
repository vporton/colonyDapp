import { FieldArray } from 'formik';
import { isNil } from 'lodash';
import React, { Fragment } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Button from '~core/Button';
import { Colony, LoggedInUser } from '~data/index';
import { ValuesType } from '~pages/ExpenditurePage/types';
import { Staged } from '~dashboard/ExpenditurePage/Staged/types';
import { Batch } from '~dashboard/ExpenditurePage/Batch/types';

import ChangeHeader from '../ChangeHeader';

import ChangeItem from './ChangeItem';
import styles from './ChangedMultiple.css';

export const MSG = defineMessages({
  discard: {
    id: 'dashboard.EditExpenditureDialog.ChangedMultiple.discard',
    defaultMessage: 'Discard',
  },
  changeRecipient: {
    id: 'dashboard.EditExpenditureDialog.ChangedMultiple.changeRecipient',
    defaultMessage: 'Change Recipient',
  },
});

const displayName = 'dashboard.EditExpenditureDialog.ChangedMultiple';
const skip = ['id', 'claimDate', 'isExpanded', 'created', 'removed'];

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
  newValues?: NewValueType[];
  colony: Colony;
  oldValues: ValuesType;
}

const ChangedMultiple = ({ newValues, oldValues, colony }: Props) => {
  const { formatMessage } = useIntl();

  if (!Array.isArray(newValues) || !Array.isArray) {
    return null;
  }

  return (
    <>
      {newValues?.map((newValue) => (
        <Fragment key={newValue.id}>
          {Array.isArray(newValue.value) &&
            newValue.value?.map((changeItem, index) => {
              const oldItem = oldValues[newValue.key]?.find(
                (item) => item?.id === changeItem?.id,
              );
              return (
                <Fragment key={changeItem.id || index}>
                  <FieldArray
                    name={newValue?.key || 'change'}
                    render={({ remove }) => (
                      <>
                        <ChangeHeader
                          name={formatMessage(MSG.changeRecipient)}
                          count={index + 1}
                          withCounter
                        />
                        {Object.entries(changeItem)?.map(([key, value]) => {
                          if (skip.includes(key)) {
                            return null;
                          }
                          if (
                            key === 'delay' &&
                            changeItem.created &&
                            isNil(value.amount)
                          ) {
                            return null;
                          }

                          const oldValue = oldItem?.[key];

                          return (
                            <ChangeItem
                              newValue={value}
                              oldValue={oldValue}
                              key={key}
                              colony={colony}
                              name={key}
                            />
                          );
                        })}
                        <div className={styles.buttonWrappper}>
                          <Button
                            className={styles.discard}
                            onClick={() => {
                              remove(index);
                            }}
                            text={MSG.discard}
                          />
                        </div>
                      </>
                    )}
                  />
                </Fragment>
              );
            })}
        </Fragment>
      ))}
    </>
  );
};

ChangedMultiple.displayName = displayName;

export default ChangedMultiple;
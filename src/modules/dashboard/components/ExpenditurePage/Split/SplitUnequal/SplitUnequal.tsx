import { FieldArray, useField, useFormikContext } from 'formik';
import React, { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import Decimal from 'decimal.js';

import { FormSection, Input, TokenSymbolSelector } from '~core/Fields';
import { AnyUser, Colony, useMembersSubscription } from '~data/index';
import { ValuesType } from '~pages/ExpenditurePage/ExpenditurePage';
import UserPickerWithSearch from '~core/UserPickerWithSearch';
import { filterUserSelection } from '~core/SingleUserPicker';
import { supRenderAvatar } from '~dashboard/ExpenditurePage/Recipient/Recipient';
import Icon from '~core/Icon';
import Slider from '~core/Slider';
import Button from '~core/Button';
import TokenIcon from '~dashboard/HookedTokenIcon';

import styles from './SplitUnequal.css';
import Numeral from '~core/Numeral';
import { getTokenDecimalsWithFallback } from '~utils/tokens';

const MSG = defineMessages({
  reserve: {
    id: 'dashboard.ExpenditurePage.Split.SplitUnequal.reserve',
    defaultMessage: 'Reserve',
  },
  amountLabel: {
    id: 'dashboard.ExpenditurePage.Split.amountLabel',
    defaultMessage: 'Amount',
  },
  deleteIconTitle: {
    id: 'dashboard.ExpenditurePage.Split.SplitUnequal.deleteIconTitle',
    defaultMessage: 'Delete recipient',
  },
  addRecipientLabel: {
    id: 'dashboard.ExpenditurePage.Split.SplitUnequal.addRecipientLabel',
    defaultMessage: 'Add recipient',
  },
});

const displayName = 'dashboard.ExpenditurePage.SplitUnequal.Split';

interface Props {
  sidebarRef: HTMLElement | null;
  colony: Colony;
}

const SplitUnequal = ({ colony, sidebarRef }: Props) => {
  const { setFieldValue } = useFormikContext<ValuesType>();

  const { tokens: colonyTokens } = colony || {};

  const [, { value: recipients }] = useField<
    { user: AnyUser; amount: number }[]
  >('split.recipients');
  const [, { value: amount }] = useField<{
    amount?: string;
    tokenAddress?: string;
  }>('split.amount');

  const token = useMemo(() => {
    return colonyTokens?.find(
      (tokenItem) =>
        amount?.tokenAddress && tokenItem.address === amount?.tokenAddress,
    );
  }, [amount, colonyTokens]);

  const { colonyAddress } = colony || {};
  const { data: colonyMembers } = useMembersSubscription({
    variables: { colonyAddress: colonyAddress || '' },
  });

  const sum = useMemo(() => {
    return recipients.reduce((acc, recipient) => {
      return acc + Number(recipient.amount);
    }, 0);
  }, [recipients]);

  const remainingStake = useMemo(() => {
    const limitForRecipient = recipients.map((recipient) =>
      new Decimal(100 - (sum - recipient.amount)).div(100),
    );
    return limitForRecipient;
  }, [recipients, sum]);

  return (
    <>
      <FormSection appearance={{ border: 'bottom' }}>
        <div className={styles.valueContainer}>
          <div className={styles.inputContainer}>
            <Input
              name="split.amount.value"
              appearance={{
                theme: 'underlined',
                size: 'small',
              }}
              label={MSG.amountLabel}
              placeholder="Not set"
              formattingOptions={{
                numeral: true,
                numeralDecimalScale: 10,
              }}
              maxButtonParams={{
                setFieldValue,
                // mock, needs to be changed to the actual value
                maxAmount: '0',
                fieldName: 'split.amount.value',
              }}
            />
          </div>
          <div className={styles.tokenWrapper}>
            <div>
              <TokenSymbolSelector
                label=""
                tokens={colonyTokens}
                name="split.amount.tokenAddress"
                appearance={{ alignOptions: 'right', theme: 'grey' }}
                elementOnly
              />
            </div>
          </div>
        </div>
      </FormSection>
      <FormSection appearance={{ border: 'bottom' }}>
        <div className={styles.reserveWrapper}>
          <FormattedMessage {...MSG.reserve} />
          <div className={styles.reserveBar}>
            <div
              className={styles.reserveIndicator}
              style={{ width: `${sum}%` }}
            />
          </div>
          <span className={styles.percent}>{sum}%</span>
        </div>
      </FormSection>
      <FieldArray
        name="split.recipients"
        render={({ push, remove }) => (
          <>
            {recipients?.map((recipient, index) => {
              return (
                <FormSection
                  appearance={{ border: 'bottom' }}
                  key={recipient?.user?.id || index}
                >
                  <div className={styles.recipientWrapper}>
                    <div>
                      <UserPickerWithSearch
                        data={colonyMembers?.subscribedUsers || []}
                        label=""
                        name={`split.recipients[${index}].user`}
                        filter={filterUserSelection}
                        renderAvatar={supRenderAvatar}
                        placeholder="Search"
                        sidebarRef={sidebarRef}
                      />
                    </div>
                    <Icon
                      name="trash"
                      className={styles.deleteIcon}
                      onClick={() => remove(index)}
                      title={MSG.deleteIconTitle}
                    />
                  </div>
                  <div className={styles.sliderWrapper}>
                    <Slider
                      value={recipients?.[index].amount || 0}
                      name={`split.recipients[${index}].amount`}
                      step={1}
                      min={0}
                      max={100}
                      limit={remainingStake[index]}
                      handleStyle={{
                        height: 18,
                        width: 18,
                      }}
                      trackStyle={{
                        height: 14,
                        width: 18,
                        transform: 'translateY(-5px)',
                        opacity: 0.85,
                      }}
                      railStyle={{
                        backgroundColor: styles.white,
                        height: 14,
                        position: 'absolute',
                        top: 0,
                        backgroundImage: 'none',
                        boxShadow: styles.boxShadow,
                        border: styles.border,
                      }}
                    />
                    <span className={styles.percent}>
                      {recipients[index].amount}%
                    </span>
                  </div>
                  {token && amount && (
                    <div className={styles.amountWrapper}>
                      <div className={styles.value}>
                        <TokenIcon
                          className={styles.tokenIcon}
                          token={token}
                          name={token.name || token.address}
                        />
                        <Numeral
                          unit={getTokenDecimalsWithFallback(0)}
                          value={amount.amount || 0}
                        />{' '}
                        {token.symbol}
                      </div>
                    </div>
                  )}
                </FormSection>
              );
            })}
            <Button
              onClick={() => push({ user: undefined, amount: 0 })}
              appearance={{ theme: 'blue' }}
            >
              <div className={styles.addRecipientLabel}>
                <Icon name="plus-circle" className={styles.circlePlusIcon} />
                <FormattedMessage {...MSG.addRecipientLabel} />
              </div>
            </Button>
          </>
        )}
      />
    </>
  );
};
SplitUnequal.displayName = displayName;

export default SplitUnequal;

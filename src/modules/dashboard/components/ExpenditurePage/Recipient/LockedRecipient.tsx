import React, { useMemo } from 'react';
import { defineMessages } from 'react-intl';

import { FormSection, InputLabel } from '~core/Fields';
import UserAvatar from '~core/UserAvatar';
import UserMention from '~core/UserMention';
import { Recipient as RecipientType } from '../Payments/types';
import TokenIcon from '~dashboard/HookedTokenIcon';

import styles from './LockedRecipient.css';
import { getTokenDecimalsWithFallback } from '~utils/tokens';
import Numeral from '~core/Numeral';
import { Colony } from '~data/index';
import { getRecipientTokens } from '../utils';

const MSG = defineMessages({
  recipientLabel: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.recipientLabel',
    defaultMessage: 'Recipient',
  },
  valueLabel: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.valueLabel',
    defaultMessage: 'Value',
  },
  delayLabel: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.delayLabel',
    defaultMessage: 'Claim delay',
  },
  tooltipMessageTitle: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.tooltipMessageTitle',
    defaultMessage: 'Security delay for claiming funds.',
  },
  tooltipMessageDescription: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.tooltipMessageDescription',
    defaultMessage: `F.ex. once the work is finished, recipient has to wait before funds can be claimed.`,
  },
  addTokenText: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.addTokenText',
    defaultMessage: 'Another token',
  },
  removeTokenText: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.removeTokenText',
    defaultMessage: 'Discard',
  },
  hoursLabel: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.hoursLabel',
    defaultMessage: 'hours',
  },
  daysLabel: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.daysLabel',
    defaultMessage: 'days',
  },
  monthsLabel: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.monthsLabel',
    defaultMessage: 'months',
  },
  valueError: {
    id: 'dashboard.ExpenditurePage.LockedRecipient.valueError',
    defaultMessage: 'Value is required',
  },
});

interface Props {
  recipient: RecipientType;
  colony: Colony;
}

const LockedRecipient = ({ recipient, colony }: Props) => {
  const {
    isExpanded,
    recipient: {
      profile: { walletAddress, username, displayName },
    },
    delay,
  } = recipient;

  const recipientValues = useMemo(() => getRecipientTokens(recipient, colony), [
    colony,
    recipient,
  ]);

  return (
    <div>
      {isExpanded && (
        <div className={styles.formContainer}>
          <FormSection appearance={{ border: 'bottom' }}>
            <div className={styles.userContainer}>
              <InputLabel
                label={MSG.recipientLabel}
                appearance={{
                  direction: 'horizontal',
                }}
              />
              <div className={styles.userAvatarContainer}>
                <UserAvatar address={walletAddress} size="xs" notSet={false} />
                <div className={styles.userName}>
                  <UserMention username={username || displayName || ''} />
                </div>
              </div>
            </div>
          </FormSection>
          <FormSection appearance={{ border: 'bottom' }}>
            <div className={styles.itemContainer}>
              <InputLabel
                label={MSG.valueLabel}
                appearance={{
                  direction: 'horizontal',
                }}
              />
              <div className={styles.tokens}>
                {recipientValues?.map(
                  ({ amount, token }, idx) =>
                    token &&
                    amount && (
                      <div className={styles.valueAmount} key={idx}>
                        <span className={styles.icon}>
                          <TokenIcon
                            className={styles.tokenIcon}
                            token={token}
                            name={token.name || token.address}
                          />
                        </span>

                        <Numeral
                          unit={getTokenDecimalsWithFallback(0)}
                          value={amount}
                        />
                        <span className={styles.symbol}>{token.symbol}</span>
                      </div>
                    ),
                )}
              </div>
            </div>
          </FormSection>
          {delay.amount && (
            <FormSection appearance={{ border: 'bottom' }}>
              <div className={styles.itemContainer}>
                <InputLabel
                  label={MSG.delayLabel}
                  appearance={{
                    direction: 'horizontal',
                  }}
                />
                <span className={styles.delayControlsContainer}>
                  {delay?.amount} {delay?.time}
                </span>
              </div>
            </FormSection>
          )}
        </div>
      )}
    </div>
  );
};

export default LockedRecipient;

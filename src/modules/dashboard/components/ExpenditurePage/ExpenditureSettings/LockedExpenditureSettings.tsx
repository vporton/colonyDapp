/* eslint-disable max-len */
import React, { useCallback, useMemo } from 'react';
import classNames from 'classnames';

import { defineMessages } from 'react-intl';
import { ROOT_DOMAIN_ID } from '@colony/colony-js';
import { InputLabel, SelectHorizontal, FormSection, Form } from '~core/Fields';
import Numeral from '~core/Numeral';

import styles from './LockedExpenditureSettings.css';
import UserAvatar from '~core/UserAvatar';
import TokenIcon from '~dashboard/HookedTokenIcon';

import { tokens as tokensData } from './constants';
import { getTokenDecimalsWithFallback } from '~utils/tokens';
import { COLONY_TOTAL_BALANCE_DOMAIN_ID } from '~constants';
import UserMention from '~core/UserMention';
import ColorTag, { Color } from '~core/ColorTag';
import { Colony } from '~data/index';

const MSG = defineMessages({
  typeLabel: {
    id:
      'dashboard.ExpenditurePage.LockedExpenditureSettings.defaultExpenditureLabel',
    defaultMessage: 'Expenditure type',
  },
  teamLabel: {
    id: 'dashboard.ExpenditurePage.LockedExpenditureSettings.defaultTeamLabel',
    defaultMessage: 'Team',
  },
  balanceLabel: {
    id:
      'dashboard.ExpenditurePage.LockedExpenditureSettings.defaultBalanceLabel',
    defaultMessage: 'Balance',
  },
  ownerLabel: {
    id: 'dashboard.ExpenditurePage.LockedExpenditureSettings.defaultOwnerLabel',
    defaultMessage: 'Owner',
  },
  optionAdvanced: {
    id:
      'dashboard.ExpenditurePage.LockedExpenditureSettings.defaultAdvancedOption',
    defaultMessage: 'Advanced payment',
  },
});

interface Props {
  expenditure?: string;
  filteredDomainId?: string;
  walletAddress: string;
  username: string;
  colony?: Colony;
}

const LockedExpenditureSettings = ({
  expenditure,
  walletAddress,
  username,
  filteredDomainId,
  colony,
}: Props) => {
  const [activeToken, ...tokens] = tokensData;

  const renderBalanceActiveOption = useCallback(
    () => (
      <div className={styles.label}>
        <span className={styles.icon}>
          <TokenIcon
            className={styles.tokenIcon}
            token={activeToken}
            name={activeToken.name || activeToken.address}
          />
        </span>

        <Numeral
          unit={getTokenDecimalsWithFallback(activeToken.decimals)}
          value={activeToken.balances[COLONY_TOTAL_BALANCE_DOMAIN_ID].amount}
        />
        <span className={styles.symbol}>{activeToken.symbol}</span>
      </div>
    ),
    [activeToken],
  );

  const balanceOptions = useMemo(
    () =>
      tokens?.map((token, index) => ({
        label: token.name,
        value: token.id,
        children: (
          <div
            className={classNames(styles.label, styles.option, {
              [styles.firstOption]: index === 0,
            })}
          >
            <span className={styles.icon}>
              <TokenIcon
                className={styles.tokenIcon}
                token={token}
                name={token.name || token.address}
              />
            </span>

            <Numeral
              unit={getTokenDecimalsWithFallback(token.decimals)}
              value={token.balances[COLONY_TOTAL_BALANCE_DOMAIN_ID].amount}
            />
            <span className={styles.symbol}>{token.symbol}</span>
          </div>
        ),
      })),
    [tokens],
  );

  const domain = useMemo(
    () =>
      colony?.domains.find(
        ({ ethDomainId }) => Number(filteredDomainId) === ethDomainId,
      ),
    [colony, filteredDomainId],
  );

  const getDomainColor = useCallback<(domainId: string | undefined) => Color>(
    (domainId) => {
      const rootDomainColor: Color = Color.LightPink;
      const defaultColor: Color = Color.Yellow;
      if (domainId === String(ROOT_DOMAIN_ID)) {
        return rootDomainColor;
      }
      if (!colony || !domainId) {
        return defaultColor;
      }
      return domain ? domain.color : defaultColor;
    },
    [colony, domain],
  );

  return (
    <div className={styles.container}>
      <>
        <FormSection appearance={{ border: 'bottom' }}>
          <div className={styles.expenditureContainer}>
            <InputLabel
              label={MSG.typeLabel}
              appearance={{
                direction: 'horizontal',
              }}
            />
            <span className={styles.expenditure}>{expenditure}</span>
          </div>
        </FormSection>
        <FormSection appearance={{ border: 'bottom' }}>
          <div className={styles.settingsRow}>
            <InputLabel
              label={MSG.teamLabel}
              appearance={{
                direction: 'horizontal',
              }}
            />
            <div className={styles.activeItem}>
              <ColorTag color={getDomainColor(filteredDomainId)} />
              <div className={styles.activeItemLabel}>{domain?.name}</div>
            </div>
          </div>
        </FormSection>
        <FormSection appearance={{ border: 'bottom' }}>
          <Form initialValues={{}} onSubmit={() => {}}>
            <div className={styles.balance}>
              <SelectHorizontal
                name="balance"
                label={MSG.balanceLabel}
                appearance={{
                  theme: 'alt',
                }}
                options={balanceOptions}
                renderActiveOption={renderBalanceActiveOption}
                unselectable
              />
            </div>
          </Form>
        </FormSection>
        <FormSection appearance={{ border: 'bottom' }}>
          <div className={styles.userContainer}>
            <InputLabel
              label={MSG.ownerLabel}
              appearance={{
                direction: 'horizontal',
              }}
            />
            <div className={styles.userAvatarContainer}>
              <UserAvatar address={walletAddress} size="xs" notSet={false} />
              <div className={styles.userName}>
                <UserMention username={username} />
              </div>
            </div>
          </div>
        </FormSection>
      </>
    </div>
  );
};

export default LockedExpenditureSettings;

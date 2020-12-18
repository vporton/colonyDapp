import React, { ReactElement } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import Icon from '~core/Icon';
import DetailsWidgetUser from '~core/DetailsWidgetUser';
import TransactionLink from '~core/TransactionLink';

import { AnyUser } from '~data/index';
import { ColonyActions } from '~types/index';
import { splitTransactionHash } from '~utils/strings';
import { EventValues } from '../../ActionsPageFeed/ActionsPageFeed';
import { ACTION_TYPES_ICONS_MAP } from '../../ActionsPage/staticMaps';

import DetailsWidgetTeam from './DetailsWidgetTeam';

import styles from './DetailsWidget.css';

const displayName = 'dashboard.ActionsPage.DetailsWidget';

const MSG = defineMessages({
  activeTeam: {
    id: 'dashboard.ActionsPage.DetailsWidget.activeTeam',
    defaultMessage: 'Active team',
  },
  actionType: {
    id: 'dashboard.ActionsPage.DetailsWidget.actionType',
    defaultMessage: 'Action Type',
  },
  fromDomain: {
    id: 'dashboard.ActionsPage.DetailsWidget.fromDomain',
    defaultMessage: 'From',
  },
  toRecipient: {
    id: 'dashboard.ActionsPage.DetailsWidget.toRecipient',
    defaultMessage: 'To',
  },
  value: {
    id: 'dashboard.ActionsPage.DetailsWidget.value',
    defaultMessage: 'Value',
  },
  transactionHash: {
    id: 'dashboard.ActionsPage.DetailsWidget.transactionHash',
    defaultMessage: 'Transaction Hash',
  },
});

interface Props {
  actionType: ColonyActions;
  recipient?: AnyUser;
  values?: EventValues;
  transactionHash?: string;
}

const DetailsWidget = ({
  actionType = ColonyActions.Generic,
  recipient,
  values,
  transactionHash,
}: Props) => {
  const { formatMessage } = useIntl();

  const showFullDetails = actionType !== ColonyActions.Generic;

  const splitHash = splitTransactionHash(transactionHash as string);
  let shortenedHash;
  if (splitHash && !showFullDetails) {
    const { header, start, end } = splitHash;
    shortenedHash = `${header}${start}...${end}`;
  }

  /*
   * @NOTE These were already being passed along as React Components, all we
   * are doing here is wrapping them in a function call so we can render them
   */
  const Amount = () => values?.amount as ReactElement;
  const Symbol = () => values?.tokenSymbol as ReactElement;

  // @TODO We need to find a better way of handling for which actions we want display which fields
  const showFromDomain =
    !ColonyActions.MintTokens && values?.fromDomain && showFullDetails;
  const showToDomain =
    !ColonyActions.MintTokens &&
    (values?.toDomain || recipient) &&
    showFullDetails;

  return (
    <div>
      <div className={styles.item}>
        <div className={styles.label}>
          <FormattedMessage {...MSG.actionType} />
        </div>
        <div className={styles.value}>
          <Icon
            title={formatMessage(
              { id: 'action.type' },
              {
                actionType: values?.actionType,
              },
            )}
            appearance={{ size: 'small' }}
            name={ACTION_TYPES_ICONS_MAP[actionType]}
          />
          <FormattedMessage
            id="action.type"
            /*
             * @NOTE We need to use the action type value that was converted to
             * camelCase since ReactIntl doesn't like keys that are composed
             * of two separate strings (apparently you can't pass it just a plain
             * string with spaces...)
             */
            values={{ actionType: values?.actionType }}
          />
        </div>
      </div>
      {showFromDomain && (
        <div className={styles.item}>
          <div className={styles.label}>
            <FormattedMessage {...MSG.fromDomain} />
          </div>
          <div className={styles.value}>
            <DetailsWidgetTeam domain={values.fromDomain} />
          </div>
        </div>
      )}
      {showToDomain && (
        <div className={styles.item}>
          <div className={styles.label}>
            <FormattedMessage {...MSG.toRecipient} />
          </div>
          <div className={styles.value}>
            {values?.toDomain && actionType === ColonyActions.MoveFunds && (
              <DetailsWidgetTeam domain={values.toDomain} />
            )}
            {recipient && actionType === ColonyActions.Payment && (
              <DetailsWidgetUser
                walletAddress={recipient?.profile.walletAddress as string}
              />
            )}
          </div>
        </div>
      )}
      {values?.amount && showFullDetails && (
        <div className={styles.item}>
          <div className={styles.label}>
            <FormattedMessage {...MSG.value} />
          </div>
          <div className={styles.value}>
            <Amount /> <Symbol />
          </div>
        </div>
      )}
      {!!shortenedHash && (
        <div className={styles.item}>
          <div className={styles.label}>
            <FormattedMessage {...MSG.transactionHash} />
          </div>
          <div className={styles.value}>
            <TransactionLink
              className={styles.transactionHashLink}
              hash={transactionHash as string}
              text={shortenedHash}
              title={transactionHash}
            />
          </div>
        </div>
      )}
    </div>
  );
};

DetailsWidget.displayName = displayName;

export default DetailsWidget;

import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import Button from '~core/Button';

import styles from './VerificationBanner.css';
import UserMention from '~core/UserMention';
import { AnyUser } from '~data/index';

const MSG = defineMessages({
  title: {
    id: 'dashboard.Incorporation.VerificationBanner.title',
    defaultMessage: '{user} Verify your identity',
  },
  description: {
    id: 'dashboard.Incorporation.VerificationBanner.title',
    defaultMessage: `To be a Protector of the incorporated organisation, you need to verify your identity. You can also remove your nomination.`,
  },
  remove: {
    id: 'dashboard.Incorporation.VerificationBanner.remove',
    defaultMessage: 'Remove',
  },
  verify: {
    id: 'dashboard.Incorporation.VerificationBanner.verify',
    defaultMessage: 'Verify',
  },
});

const displayName = 'dashboard.Incorporation.VerificationBanner';

export interface Props {
  user: AnyUser;
}

const VerificationBanner = ({ user }: Props) => {
  return (
    <div className={styles.wrapper}>
      <div>
        <div className={styles.title}>
          <FormattedMessage
            {...MSG.title}
            values={{
              user: (
                <UserMention
                  username={
                    user.profile.username || user.profile.displayName || ''
                  }
                />
              ),
            }}
          />
        </div>
        <div className={styles.description}>
          <FormattedMessage {...MSG.description} />
        </div>
      </div>
      <div className={styles.buttonsWrapper}>
        <Button text={MSG.remove} className={styles.removeButton} />
        <Button text={MSG.verify} className={styles.verifyButton} />
      </div>
    </div>
  );
};

VerificationBanner.displayName = displayName;

export default VerificationBanner;

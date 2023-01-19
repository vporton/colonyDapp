import React, { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { FormSection, InputLabel } from '~core/Fields';
import QuestionMarkTooltip from '~core/QuestionMarkTooltip';
import { ValuesType } from '~pages/IncorporationPage/types';
import UserAvatar from '~core/UserAvatar';
import UserMention from '~core/UserMention';
import Tag from '~core/Tag';

import { SignOption, VerificationStatus } from '../constants';

import styles from './LockedProtectors.css';

export const MSG = defineMessages({
  protectors: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.protectors`,
    defaultMessage: 'Protectors',
  },
  protectorsTooltip: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.protectorsTooltip`,
    defaultMessage: `A Protector's role in a DAO legal corporation is to ratify the decisions of the DAO. Their purpose is to act on behalf of the DAO and handle legal the required administration. Learn more`,
  },
  unverified: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.unverified`,
    defaultMessage: 'Unverified',
  },
  verified: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.verified`,
    defaultMessage: 'Verified',
  },
  mainContact: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.mainContact`,
    defaultMessage: 'Main contact',
  },
  signing: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.signing`,
    defaultMessage: 'Signing',
  },
  mainContactTooltip: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.mainContactTooltip`,
    defaultMessage: `The main contact is required during the incorporation process and is also required to use their delivery address details for the registration.`,
  },
  signOptionTooltip: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.signOptionTooltip`,
    defaultMessage: `Decide the requirements as to how many Protectors are required to sign legal documents to enact the decisions of a DAO.`,
  },
  individual: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.individual`,
    defaultMessage: 'Individual signing',
  },
  multiple: {
    id: `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors.multiple`,
    defaultMessage: 'All need to sign',
  },
});

const displayName = `dashboard.DAOIncorporation.IncorporationForm.LockedProtectors`;

export interface Props {
  formValues: ValuesType;
}

const LockedProtectors = ({ formValues }: Props) => {
  const signLabel = useMemo(() => {
    return formValues.signOption === SignOption.Individual
      ? MSG.individual
      : MSG.multiple;
  }, [formValues]);

  return (
    <>
      <FormSection>
        <div className={styles.wrapper}>
          <div className={styles.protectorsLabelWrapper}>
            <div className={styles.label}>
              <FormattedMessage {...MSG.protectors} />
            </div>
            <QuestionMarkTooltip tooltipText={MSG.protectorsTooltip} />
          </div>
        </div>
      </FormSection>
      <FormSection appearance={{ border: 'bottom' }}>
        {formValues.protectors?.map((protector) => {
          const { user } = protector || {};
          const { profile } = user || {};
          const { walletAddress, username, displayName: userDispalyName } =
            profile || {};

          return (
            <div className={styles.row}>
              <Tag
                appearance={{
                  colorSchema: 'fullColor',
                  theme: protector.verified ? 'primary' : 'danger',
                }}
              >
                {protector.verified
                  ? VerificationStatus.Verified
                  : VerificationStatus.Unverified}
              </Tag>
              <div className={styles.userAvatarContainer}>
                <UserAvatar
                  address={walletAddress || ''}
                  size="xs"
                  notSet={false}
                />
                <div className={styles.userName}>
                  <UserMention username={username || userDispalyName || ''} />
                </div>
              </div>
            </div>
          );
        })}
      </FormSection>
      {(formValues.protectors?.length || 0) > 1 && (
        <div className={styles.mianContactWrapper}>
          <FormSection appearance={{ border: 'bottom' }}>
            <div className={styles.mainContactRow}>
              <div className={styles.labelWrapper}>
                <InputLabel label={MSG.mainContact} />
                <QuestionMarkTooltip tooltipText={MSG.mainContactTooltip} />
              </div>
              <div className={styles.userAvatarContainer}>
                <UserAvatar
                  address={formValues.mainContact?.profile?.walletAddress || ''}
                  size="xs"
                  notSet={false}
                />
                <div className={styles.userName}>
                  <UserMention
                    username={
                      formValues.mainContact?.profile.username ||
                      formValues.mainContact?.profile.displayName ||
                      ''
                    }
                  />
                </div>
              </div>
            </div>
          </FormSection>
          <FormSection appearance={{ border: 'bottom' }}>
            <div className={styles.signOptionWrapper}>
              <div className={styles.labelWrapper}>
                <InputLabel label={MSG.signing} />
                <QuestionMarkTooltip tooltipText={MSG.signOptionTooltip} />
              </div>
              <div className={styles.signing}>
                <FormattedMessage {...signLabel} />
              </div>
            </div>
          </FormSection>
        </div>
      )}
    </>
  );
};

LockedProtectors.displayName = displayName;

export default LockedProtectors;

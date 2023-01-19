import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useFormikContext } from 'formik';
import classNames from 'classnames';

import {
  FormSection,
  Input,
  Textarea,
  InputLabel,
  InputStatus,
} from '~core/Fields';
import QuestionMarkTooltip from '~core/QuestionMarkTooltip';
import { Colony } from '~data/index';
import Icon from '~core/Icon';
import { ValuesType } from '~pages/IncorporationPage/types';

import Protectors from './Protectors';
import styles from './IncorporationForm.css';

export const MSG = defineMessages({
  incorporation: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.incorporation',
    defaultMessage: 'Incorporation',
  },
  initialCost: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.initialCost',
    defaultMessage: 'Initial cost',
  },
  ongoingCost: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.ongoingCost',
    defaultMessage: 'Ongoing cost',
  },
  cost: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.cost',
    defaultMessage: '{icon} {amount} {currency}',
  },
  nameLabel: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.nameLabel',
    defaultMessage: 'Name of Corporation',
  },
  alternativelNamesLabel: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.alternativelNamesLabel',
    defaultMessage: 'Alternative names',
  },
  alternativeNamesTooltip: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.alternativeNamesTooltip',
    defaultMessage: `If your first choice is unavailable, we will try to register one of these alternatives. Please avoid trademark infringement.`,
  },
  purposeLabel: {
    id: 'dashboard.DAOIncorporation.IncorporationForm.descriptionLabel',
    defaultMessage: 'Describe the purpose of the DAO',
  },
});

const displayName = 'dashboard.DAOIncorporation.IncorporationForm';

export interface Props {
  sidebarRef: HTMLElement | null;
  colony: Colony;
}

const IncorporationForm = ({ colony, sidebarRef }: Props) => {
  const { errors, touched } = useFormikContext<ValuesType>();

  return (
    <div className={styles.container}>
      <FormSection appearance={{ border: 'bottom' }}>
        <div className={styles.title}>
          <FormattedMessage {...MSG.incorporation} />
        </div>
      </FormSection>
      <FormSection appearance={{ border: 'bottom' }}>
        <div className={styles.costRow}>
          <div className={styles.label}>
            <FormattedMessage {...MSG.initialCost} />
          </div>
          <div className={styles.cost}>
            <FormattedMessage
              {...MSG.cost}
              values={{
                icon: <Icon name="usd-coin" appearance={{ size: 'medium' }} />,
                amount: '5,300',
                currency: 'USDC',
              }}
            />
          </div>
        </div>
      </FormSection>
      <FormSection appearance={{ border: 'bottom' }}>
        <div className={styles.costRow}>
          <div className={styles.label}>
            <FormattedMessage {...MSG.ongoingCost} />
          </div>
          <div className={styles.cost}>
            <FormattedMessage
              {...MSG.cost}
              values={{
                icon: <Icon name="usd-coin" appearance={{ size: 'medium' }} />,
                amount: '3,800 / year',
                currency: 'USDC',
              }}
            />
          </div>
        </div>
      </FormSection>
      <FormSection appearance={{ border: 'bottom' }}>
        <div
          className={classNames(styles.nameInputs, {
            [styles.marginSmall]:
              errors.alternativeName1 || errors.alternativeName2,
          })}
        >
          <div
            className={classNames({
              [styles.error]: errors.name,
            })}
          >
            <Input name="name" label={MSG.nameLabel} />
          </div>

          <div className={styles.labelWrapper}>
            <InputLabel label={MSG.alternativelNamesLabel} />
            <QuestionMarkTooltip tooltipText={MSG.alternativeNamesTooltip} />
          </div>
          <div
            className={classNames({
              [styles.error]:
                errors.alternativeName1 || errors.alternativeName2,
            })}
          >
            <Input name="alternativeName1" elementOnly />
          </div>
          <div
            className={classNames({
              [styles.error]:
                errors.alternativeName1 || errors.alternativeName2,
            })}
          >
            <Input name="alternativeName2" elementOnly />
          </div>
          {(errors.alternativeName1 || errors.alternativeName2) && (
            <InputStatus
              error={errors.alternativeName1 || errors.alternativeName2}
              touched={touched.alternativeName1 || touched.alternativeName2}
            />
          )}
        </div>
      </FormSection>
      <FormSection appearance={{ border: 'bottom' }}>
        <div
          className={classNames(styles.inputWrapper, {
            [styles.error]: errors.purpose,
          })}
        >
          <Textarea name="purpose" label={MSG.purposeLabel} maxLength={90} />
        </div>
      </FormSection>
      <Protectors colony={colony} sidebarRef={sidebarRef} />
    </div>
  );
};

IncorporationForm.displayName = displayName;

export default IncorporationForm;

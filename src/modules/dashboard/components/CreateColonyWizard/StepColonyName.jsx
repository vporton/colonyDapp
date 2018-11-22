/* @flow */

import React from 'react';
import { defineMessages } from 'react-intl';
import * as yup from 'yup';

import type { WizardProps } from '~core/Wizard';

import styles from './StepColonyName.css';

import { Form, Input } from '~core/Fields';
import Heading from '~core/Heading';
import Button from '~core/Button';

const MSG = defineMessages({
  heading: {
    id: 'dashboard.CreateColonyWizard.StepColonyName.heading',
    defaultMessage: 'What would you like to name your Colony?',
  },
  label: {
    id: 'dashboard.CreateColonyWizard.StepColonyName.label',
    defaultMessage: 'Colony Name',
  },
  helpText: {
    id: 'dashboard.CreateColonyWizard.StepColonyName.helpText',
    defaultMessage: 'So, this is some placeholder text',
  },
  placeholder: {
    id: 'dashboard.CreateColonyWizard.StepColonyName.placeholder',
    defaultMessage: 'Type a display name for a colony',
  },
  cancel: {
    id: 'dashboard.CreateColonyWizard.StepColonyName.cancel',
    defaultMessage: 'Cancel',
  },
  next: {
    id: 'dashboard.CreateColonyWizard.StepColonyName.next',
    defaultMessage: 'Next',
  },
});

const validationSchema = yup.object({
  colonyName: yup.string().required(),
});

type FormValues = {
  colonyName: string,
};

type Props = WizardProps<FormValues>;

const displayName = 'dashboard.CreateColonyWizard.StepColonyName';

const StepColonyName = ({ nextStep, wizardValues }: Props) => (
  <Form
    onSubmit={nextStep}
    initialValues={wizardValues}
    validationSchema={validationSchema}
  >
    {({ isValid }) => (
      <section className={styles.content}>
        <div className={styles.title}>
          <Heading
            appearance={{ size: 'medium', weight: 'thin' }}
            text={MSG.heading}
          />
          <div className={styles.nameForm}>
            <Input
              name="colonyName"
              label={MSG.label}
              placeholder={MSG.placeholder}
            />
            <div className={styles.buttons}>
              <Button appearance={{ theme: 'secondary' }} text={MSG.cancel} />
              <Button
                appearance={{ theme: 'primary' }}
                type="submit"
                disabled={!isValid}
                text={MSG.next}
              />
            </div>
          </div>
        </div>
      </section>
    )}
  </Form>
);

StepColonyName.displayName = displayName;

export default StepColonyName;

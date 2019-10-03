import { $PropertyType } from 'utility-types';
import { FormikBag } from 'formik';
import React, { useCallback, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import * as yup from 'yup';

import { WizardProps } from '~core/Wizard';
import { Form, Input } from '~core/Fields';
import Heading from '~core/Heading';
import Button from '~core/Button';
import FileUpload from '~core/FileUpload';
import { multiLineTextEllipsis } from '~utils/strings';
import ENS from '~lib/ENS';
import TokenSelector from './TokenSelector';
import styles from './StepSelectToken.css';

type TokenData = {
  name: string;
  symbol: string;
} | null;

interface FormValues {
  tokenAddress: string;
  tokenChoice: 'create' | 'select';
  tokenSymbol?: string;
  tokenName?: string;
  iconUpload?: string;
  tokenData: TokenData | null;
  colonyName: string;
}

type Bag = FormikBag<object, FormValues>;
type SetFieldValue = $PropertyType<Bag, 'setFieldValue'>;

type Props = WizardProps<FormValues>;

const MSG = defineMessages({
  heading: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.heading',
    defaultMessage: 'Which ERC20 token would you like to use for {colony}',
  },
  symbolHint: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.symbolHint',
    defaultMessage: 'Max of 6 characters',
  },
  tokenName: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.tokenName',
    defaultMessage: 'Token Name',
  },
  tokenSymbol: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.tokenSymbol',
    defaultMessage: 'Token Symbol',
  },
  continue: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.continue',
    defaultMessage: 'Continue',
  },
  invalidAddress: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.invalidAddress',
    defaultMessage:
      'Not a valid token. Only ERC20 tokens with 18 decimals are supported.',
  },
  link: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.link',
    defaultMessage: 'I want to create a New Token',
  },
  fileUploadTitle: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.fileUpload',
    defaultMessage: 'Token Icon (.svg or .png)',
  },
  fileUploadHint: {
    id: 'dashboard.CreateColonyWizard.StepSelectToken.fileUploadHint',
    defaultMessage: 'Recommended size for .png file is 60px by 60px, up to 1MB',
  },
});

export const validationSchema = yup.object({
  tokenAddress: yup
    .string()
    // @ts-ignore
    .address(MSG.invalidAddress),
  tokenSymbol: yup.string().max(6),
  tokenName: yup.string(),
});

const StepSelectToken = ({
  nextStep,
  previousStep,
  wizardForm: { initialValues },
  wizardValues,
}: Props) => {
  const [tokenData, setTokenData] = useState();

  const handleTokenSelect = (data: TokenData, setFieldValue: SetFieldValue) => {
    setTokenData(data);
    if (data) {
      setFieldValue('tokenName', data.name);
      setFieldValue('tokenSymbol', data.symbol);
    }
  };

  const goToTokenCreate = useCallback(() => {
    /* This is a custom link since it goes to a sibling step that appears
      to be parallel to this one after the wizard steps diverge,
      while making sure that the data form the previous wizard steps doesn't get lost
      TODO: there will be smoother solution or this, we already have an issue for it:
      https://github.com/JoinColony/colonyDapp/issues/1057
    */
    const wizardValuesCopy: FormValues = { ...wizardValues };
    previousStep();
    wizardValuesCopy.tokenChoice = 'create';
    nextStep(wizardValuesCopy);
  }, [wizardValues, nextStep, previousStep]);

  return (
    <section className={styles.main}>
      <div className={styles.title}>
        <Heading appearance={{ size: 'medium', weight: 'bold' }}>
          <FormattedMessage
            {...MSG.heading}
            values={{
              /*
               * @NOTE We need to use a JS string truncate here, rather then CSS,
               * since we're dealing with a string that needs to be truncated,
               * inside a sentence that does not
               */
              colony: (
                <span title={ENS.normalizeAsText(wizardValues.colonyName)}>
                  {multiLineTextEllipsis(
                    ENS.normalizeAsText(wizardValues.colonyName),
                    38,
                  )}
                </span>
              ),
            }}
          />
        </Heading>
      </div>
      <Form
        className={styles.nameForm}
        onSubmit={nextStep}
        validationSchema={validationSchema}
        initialValues={initialValues}
      >
        {({ isValid, setFieldValue, values }) => (
          <div>
            <TokenSelector
              tokenAddress={values.tokenAddress}
              onTokenSelect={(data: TokenData) =>
                handleTokenSelect(data, setFieldValue)
              }
              tokenData={tokenData}
              extra={
                <button
                  type="button"
                  className={styles.linkToOtherStep}
                  tabIndex={-2}
                  onClick={goToTokenCreate}
                >
                  <FormattedMessage {...MSG.link} />
                </button>
              }
            />
            {values.tokenAddress && !tokenData && (
              <>
                <div className={styles.tokenDetails}>
                  <Input name="tokenName" label={MSG.tokenName} />
                </div>
                <div className={styles.tokenDetails}>
                  <Input
                    name="tokenSymbol"
                    label={MSG.tokenSymbol}
                    hint={
                      <Heading
                        appearance={{ size: 'small', weight: 'thin' }}
                        text={MSG.symbolHint}
                      />
                    }
                  />
                </div>
                <div className={styles.tokenDetails}>
                  <FileUpload
                    label={MSG.fileUploadTitle}
                    name="iconUpload"
                    status={MSG.fileUploadHint}
                  />
                </div>
              </>
            )}
            <div className={styles.buttons}>
              <Button
                appearance={{ theme: 'primary', size: 'large' }}
                type="submit"
                disabled={!isValid}
                text={MSG.continue}
              />
            </div>
          </div>
        )}
      </Form>
    </section>
  );
};

StepSelectToken.displayName = 'dashboard.CreateColonyWizard.StepSelectToken';

export default StepSelectToken;

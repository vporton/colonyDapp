import { Form, useFormikContext } from 'formik';
import React, { useCallback, useEffect, useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { ExpenditureSettings } from '~dashboard/ExpenditurePage';
import Batch from '~dashboard/ExpenditurePage/Batch';
import Payments from '~dashboard/ExpenditurePage/Payments';
import Split from '~dashboard/ExpenditurePage/Split';
import Staged from '~dashboard/ExpenditurePage/Staged';
import { Colony } from '~data/index';
import StakeExpenditureDialog from '~dashboard/Dialogs/StakeExpenditureDialog';
import { useDialog } from '~core/Dialog';

import { ValuesType, ExpenditureTypes } from './types';
import styles from './ExpenditurePage.css';

const MSG = defineMessages({
  submit: {
    id: 'dashboard.ExpenditurePage.ExpenditureForm.submit',
    defaultMessage: 'Submit',
  },
});

interface Props {
  colony: Colony;
  sidebarRef: HTMLElement | null;
  setShouldValidate: React.Dispatch<React.SetStateAction<boolean>>;
  inEditMode: boolean;
}

const ExpenditureForm = ({
  sidebarRef,
  colony,
  setShouldValidate,
  inEditMode,
}: Props) => {
  const { values, handleSubmit, validateForm } =
    useFormikContext<ValuesType>() || {};

  useEffect(() => {
    if (values.expenditure === ExpenditureTypes.Batch) {
      setShouldValidate(true);
    }
  }, [setShouldValidate, values]);

  const openDraftConfirmDialog = useDialog(StakeExpenditureDialog);

  const onSubmit = useCallback(
    // eslint-disable-next-line consistent-return
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const errors = await validateForm(values);
      const hasErrors = Object.keys(errors)?.length;

      return (
        !hasErrors &&
        openDraftConfirmDialog({
          onClick: () => {
            handleSubmit(values as any);
          },
          isVotingExtensionEnabled: true,
          colony,
        })
      );
    },
    [colony, handleSubmit, openDraftConfirmDialog, validateForm, values],
  );

  const secondFormSection = useMemo(() => {
    const expenditureType = values.expenditure;
    switch (expenditureType) {
      case ExpenditureTypes.Advanced: {
        return <Payments sidebarRef={sidebarRef} colony={colony} />;
      }
      case ExpenditureTypes.Staged: {
        return <Staged colony={colony} sidebarRef={sidebarRef} />;
      }
      case ExpenditureTypes.Split: {
        return <Split sidebarRef={sidebarRef} colony={colony} />;
      }
      case ExpenditureTypes.Batch: {
        return <Batch colony={colony} />;
      }
      default:
        return null;
    }
  }, [colony, sidebarRef, values]);

  return (
    <Form onSubmit={onSubmit}>
      <ExpenditureSettings {...{ sidebarRef, colony, inEditMode }} />
      {secondFormSection}
      <button type="submit" tabIndex={-1} className={styles.hiddenSubmit}>
        <FormattedMessage {...MSG.submit} />
      </button>
    </Form>
  );
};

export default ExpenditureForm;
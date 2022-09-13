import { useFormikContext, setNestedObjectValues, FormikTouched } from 'formik';
import React, { useCallback } from 'react';

import { useDialog } from '~core/Dialog';
import DeleteDraftDialog from '~dashboard/Dialogs/DeleteDraftDialog/DeleteDraftDialog';
import StakeExpenditureDialog from '~dashboard/Dialogs/StakeExpenditureDialog';
import StartStreamDialog from '~dashboard/Dialogs/StartStreamDialog';
import { Colony } from '~data/index';
import {
  ExpenditureTypes,
  State,
  ValuesType,
} from '~pages/ExpenditurePage/types';

import { Stage } from './constants';
import Stages from './Stages';
import StreamingStages from './StreamingStages';

const displayName = 'dashboard.ExpenditurePage.Stages.FormStages';

interface Props {
  states: State[];
  activeStateId?: string;
  setActiveStateId?: React.Dispatch<React.SetStateAction<string | undefined>>;
  setFormValues?: React.Dispatch<React.SetStateAction<ValuesType | undefined>>;
  colony: Colony;
  handleCancelExpenditure: () => void;
}

const FormStages = ({
  states,
  activeStateId,
  setActiveStateId,
  setFormValues,
  colony,
  handleCancelExpenditure,
}: Props) => {
  const { values, handleSubmit, validateForm, resetForm, setTouched } =
    useFormikContext<ValuesType>() || {};
  const openDeleteDraftDialog = useDialog(DeleteDraftDialog);
  const openDraftConfirmDialog = useDialog(StakeExpenditureDialog);
  const openStartStreamDialog = useDialog(StartStreamDialog);

  const handleSaveDraft = useCallback(async () => {
    const errors = await validateForm(values);
    const hasErrors = Object.keys(errors)?.length;
    setTouched(setNestedObjectValues<FormikTouched<ValuesType>>(errors, true));

    if (values.expenditure === ExpenditureTypes.Streaming) {
      return (
        !hasErrors &&
        colony &&
        openStartStreamDialog({
          onClick: () => {
            handleSubmit(values as any);
            setActiveStateId?.(Stage.Released);
          },
          isVotingExtensionEnabled: true,
          values,
          colony,
        })
      );
    }

    return (
      !hasErrors &&
      colony &&
      openDraftConfirmDialog({
        onClick: () => {
          handleSubmit(values as any);
          setActiveStateId?.(Stage.Draft);
        },
        isVotingExtensionEnabled: true,
        colony,
      })
    );
  }, [
    colony,
    handleSubmit,
    openDraftConfirmDialog,
    openStartStreamDialog,
    setActiveStateId,
    setTouched,
    validateForm,
    values,
  ]);

  const handleDeleteDraft = () =>
    openDeleteDraftDialog({
      onClick: () => {
        resetForm?.();
        // add logic to delete the draft from database
        setActiveStateId?.(undefined);
        setFormValues?.(undefined);
      },
    });
  const activeState = states.find((state) => state.id === activeStateId);

  const handleButtonClick = useCallback(async () => {
    const errors = await validateForm(values);
    const hasErrors = Object.keys(errors)?.length;
    setTouched(setNestedObjectValues<FormikTouched<ValuesType>>(errors, true));

    if (!hasErrors) {
      handleSubmit(values as any);
      activeState?.buttonAction();
    }
  }, [activeState, handleSubmit, setTouched, validateForm, values]);

  if (values.expenditure === ExpenditureTypes.Streaming) {
    return <StreamingStages handleSaveDraft={handleSaveDraft} />;
  }

  return (
    <Stages
      {...{
        states,
        activeStateId,
        setActiveStateId,
        handleButtonClick,
        handleDeleteDraft,
        handleSaveDraft,
        handleCancelExpenditure,
        colony,
      }}
    />
  );
};

FormStages.displayName = displayName;

export default FormStages;

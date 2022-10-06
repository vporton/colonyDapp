import React, { useMemo } from 'react';
import LockedBatch from '~dashboard/ExpenditurePage/Batch/LockedBatch';

import { LockedExpenditureSettings } from '~dashboard/ExpenditurePage/ExpenditureSettings';
import { LockedPayments } from '~dashboard/ExpenditurePage/Payments';
import LockedSplit from '~dashboard/ExpenditurePage/Split/LockedSplit';
import LockedStaged from '~dashboard/ExpenditurePage/Staged/LockedStaged/LockedStaged';
import { Status } from '~dashboard/ExpenditurePage/Stages/constants';
import { Colony } from '~data/index';

import { ExpenditureTypes, State, ValuesType } from './types';

const displayName = 'pages.ExpenditurePage.LockedSidebar';

interface Props {
  colony: Colony;
  formValues?: ValuesType;
  editForm: () => void;
  pendingChanges?: Partial<ValuesType>;
  status?: Status;
  isCancelled?: boolean;
  pendingMotion?: boolean;
  activeState?: State;
  handleReleaseMilestone: (id: string) => void;
}

const LockedSidebar = ({
  colony,
  formValues,
  editForm,
  pendingChanges,
  isCancelled,
  pendingMotion,
  status,
  activeState,
  handleReleaseMilestone,
}: Props) => {
  const { expenditure, recipients, filteredDomainId, staged, split, batch } =
    formValues || {};

  const secondFormSection = useMemo(() => {
    switch (expenditure) {
      case ExpenditureTypes.Advanced: {
        return (
          <LockedPayments
            recipients={recipients}
            colony={colony}
            editForm={editForm}
            pendingChanges={pendingChanges}
            status={status}
            isCancelled={isCancelled}
            pendingMotion={pendingMotion}
            activeState={activeState}
          />
        );
      }
      case ExpenditureTypes.Split: {
        return (
          <LockedSplit colony={colony} split={split} editForm={editForm} />
        );
      }
      case ExpenditureTypes.Staged: {
        return (
          <LockedStaged
            colony={colony}
            staged={staged}
            activeStateId={activeState?.id}
            handleReleaseMilestone={handleReleaseMilestone}
            editForm={editForm}
          />
        );
      }
      case ExpenditureTypes.Batch: {
        return batch ? <LockedBatch batch={batch} /> : null;
      }
      default:
        return null;
    }
  }, [
    activeState,
    batch,
    colony,
    editForm,
    expenditure,
    handleReleaseMilestone,
    isCancelled,
    pendingChanges,
    pendingMotion,
    recipients,
    split,
    staged,
    status,
  ]);

  return (
    <>
      <LockedExpenditureSettings
        {...{ expenditure, filteredDomainId, colony }}
      />
      {secondFormSection}
    </>
  );
};

LockedSidebar.displayName = displayName;

export default LockedSidebar;
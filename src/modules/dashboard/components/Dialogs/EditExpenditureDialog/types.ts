import { Batch } from '~dashboard/ExpenditurePage/Batch/types';
import { Staged } from '~dashboard/ExpenditurePage/Staged/types';
import { LoggedInUser } from '~data/generated';
import { ValuesType } from '~pages/ExpenditurePage/types';

export type NewValueType = {
  id: string;
  key: string;
  value?:
    | ValuesType['recipients']
    | string
    | Staged
    | Pick<
        LoggedInUser,
        'walletAddress' | 'balance' | 'username' | 'ethereal' | 'networkId'
      >
    | Batch;
};
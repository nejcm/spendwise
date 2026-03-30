import type { AccountFormData } from '@/features/accounts/types';
import type { CategoryInitialValues } from '@/features/categories/category-form';
import type { ScheduledTransactionInitialValues } from '@/features/scheduled-transactions/components/scheduled-transaction-form';

// ---------------------------------------------------------------------------
// Sheet config – discriminated union so each sheet carries exactly the data
// it needs. No serialisation, no URL pollution.
// ---------------------------------------------------------------------------

export type SheetConfig
  = | { type: 'add-transaction'; categoryId?: string }
    | { type: 'add-account' }
    | { type: 'edit-account'; accountId: string; initialData: AccountFormData }
    | { type: 'add-category' }
    | { type: 'edit-category'; categoryId: string; initialValues: CategoryInitialValues }
    | {
      type: 'add-scheduled';
      initialValues?: ScheduledTransactionInitialValues;
    };

export type SheetType = SheetConfig['type'];

// ---------------------------------------------------------------------------
// Snap points per sheet type
// ---------------------------------------------------------------------------

export const SHEET_SNAP_POINTS: Record<SheetType, string[]> = {
  'add-transaction': ['80%'],
  'add-account': ['72%'],
  'edit-account': ['72%'],
  'add-category': ['58%'],
  'edit-category': ['58%'],
  'add-scheduled': ['82%'],
};

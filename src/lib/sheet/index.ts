import type { AccountFormData } from '@/features/accounts/types';

// ---------------------------------------------------------------------------
// Sheet config – discriminated union so each sheet carries exactly the data
// it needs. No serialisation, no URL pollution.
// ---------------------------------------------------------------------------

export type SheetConfig
  = | { type: 'add-transaction'; categoryId?: string }
    | { type: 'add-account' }
    | { type: 'edit-account'; accountId: string; initialData: AccountFormData }
    | { type: 'add-category' }
    | { type: 'edit-category'; categoryId: string; name: string; color: string; icon: string | null }
    | { type: 'add-scheduled' };

export type SheetType = SheetConfig['type'];

// ---------------------------------------------------------------------------
// Snap points per sheet type
// ---------------------------------------------------------------------------

export const SHEET_SNAP_POINTS: Record<SheetType, string[]> = {
  'add-transaction': ['82%'],
  'add-account': ['82%'],
  'edit-account': ['82%'],
  'add-category': ['55%'],
  'edit-category': ['55%'],
  'add-scheduled': ['82%'],
};

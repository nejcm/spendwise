// Transaction-specific exports
export * from './hooks';
export * from './queries';

// Backward-compat re-exports: account hooks were previously defined here.
// Callers should migrate to importing from '@/features/accounts/api'.
export {
  useAccounts,
  useAccountsWithBalance,
  useAccountsWithBalanceForMonth,
  useAccountsWithBalanceForRange,
  useTotalBalance,
} from '@/features/accounts/hooks';

// Backward-compat re-exports: category hooks were previously defined here.
// Callers should migrate to importing from '@/features/categories/api'.
export {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  useUpdateCategoryOrder,
} from '@/features/categories/hooks';

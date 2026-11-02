import type { Category, CategoryFormData } from './types';
import type { BudgetState } from '@/components/ui/budget-state';
import type { TransactionType } from '@/features/transactions/types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { useCSSVariable, useUniwind } from 'uniwind';
import { Alert } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { translate } from '@/lib/i18n';
import { getAppState, setTransactionFormPrefs, useAppStore } from '@/lib/store/store';

import { fitsTransactionType } from './helpers';
import * as queries from './queries';

export function useCategories(type?: TransactionType) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => queries.getCategories(db),
    select: type ? (categories: Category[]) => categories.filter((c) => fitsTransactionType(c, type)) : undefined,
  });
}

function onError(error: unknown) {
  if (error instanceof Error) captureError(error, { context: 'categories' });
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

export function useCreateCategory(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormData) => queries.createCategory(db, data),
    onSuccess: () => {
      invalidateFor(queryClient, 'category');
      onSuccess?.();
    },
    onError,
  });
}

export function useUpdateCategory(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: CategoryFormData }) =>
      queries.updateCategory(db, params.id, params.data),
    onSuccess: () => {
      invalidateFor(queryClient, 'category');
      onSuccess?.();
    },
    onError,
  });
}

export function useCategoryUsage(id: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.categories.usage(id ?? ''),
    queryFn: () => queries.getCategoryUsage(db, id!),
    enabled: !!id,
  });
}

export function useCategoryMonthlyTotals(id: string, startDate: number, endDate: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.categoryMonthly(id, startDate, endDate),
    queryFn: () => queries.getCategoryMonthlyTotals(db, id, startDate, endDate),
  });
}

export function useDeleteCategory(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, targetId }: { id: string; targetId?: string }) => queries.deleteCategory(db, id, targetId),
    onSuccess: (_, { id }) => {
      const prefs = getAppState().formPrefs.transactionForm;
      if (prefs.category_id === id) setTransactionFormPrefs({ ...prefs, category_id: undefined });
      invalidateFor(queryClient, 'category', 'transaction', 'scheduledTransaction');
      onSuccess?.();
    },
    onError,
  });
}

export function useUpdateCategoryOrder() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ id: string; sort_order: number }>) =>
      queries.updateCategoryOrder(db, items),
    onSuccess: () => {
      invalidateFor(queryClient, 'category');
    },
    onError,
  });
}

/** Formats cents in the Preferred Currency with the user's number settings. */
export function useFormatMoney() {
  const currency = useAppStore((s) => s.currency);
  const numberFormat = useAppStore((s) => s.numberFormat);
  const currencyFormat = useAppStore((s) => s.currencyFormat);
  return (cents: number, fractionDigits?: number, shorten?: boolean | number) => formatCurrency(cents, currency, { numberFormat, currencyFormat, fractionDigits, shorten });
}

/** Hex fills for budget states, for svg marks that can't take class names. */
export function useBudgetColors(): Record<BudgetState | 'track' | 'muted', string> {
  const { theme } = useUniwind();
  const [accent, negative, track, muted, warningLight, warningDark] = useCSSVariable([
    '--color-accent',
    '--color-negative',
    '--color-track',
    '--color-muted-foreground',
    '--color-warning-500',
    '--color-warning-400',
  ]).map(String);
  return { none: accent, normal: accent, warning: theme === 'dark' ? warningDark : warningLight, over: negative, track, muted };
}

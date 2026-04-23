import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, subMonths } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';

import { Alert } from '@/components/ui';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { dateToUnix } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';

import * as queries from './queries';

function getPrevYearMonth(): number {
  const prev = subMonths(startOfMonth(new Date()), 1);
  return Number(format(prev, 'yyyyMM'));
}

function getCurrentMonthRange(): [number, number] {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  return [dateToUnix(monthStart), dateToUnix(nextMonthStart)];
}

export function useBudgetOverview() {
  const db = useSQLiteContext();
  const yearMonth = format(new Date(), 'yyyyMM');
  return useQuery({
    queryKey: queryKeys.budgets.overview(yearMonth),
    queryFn: () => {
      const [monthStart, monthEnd] = getCurrentMonthRange();
      return queries.getBudgetOverview(db, monthStart, monthEnd, getPrevYearMonth());
    },
  });
}

export function useUnbudgetedCategories() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: [...queryKeys.budgets.all, 'unbudgeted'],
    queryFn: () => queries.getUnbudgetedCategories(db),
  });
}

export function useBudgetMonthlyHistory(categoryId: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.budgets.history(categoryId ?? ''),
    queryFn: () => queries.getBudgetMonthlyHistory(db, categoryId!),
    enabled: !!categoryId,
  });
}

export function useRolloverHistory(categoryId: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.budgets.rollover(categoryId ?? ''),
    queryFn: () => queries.getRolloverHistory(db, categoryId!),
    enabled: !!categoryId,
  });
}

function onError(error: unknown) {
  if (error instanceof Error) captureError(error, { context: 'budgets' });
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

export function useUpsertBudgetRollover() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; categoryId: string; yearMonth: number; rolloverAmount: number }) =>
      queries.upsertBudgetRollover(db, params.id, params.categoryId, params.yearMonth, params.rolloverAmount),
    onSuccess: () => {
      invalidateFor(queryClient, 'budgetRollover');
    },
    onError,
  });
}

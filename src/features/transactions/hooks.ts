import type { TransactionFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import Alert from '@/components/ui/alert';
import { computeBaseAmount } from '@/features/currencies/conversion';
import { getRatesForDate } from '@/features/currencies/queries';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { translate } from '@/lib/i18n';

import { amountToCents } from '../formatting/helpers';
import * as queries from './queries';

// ─── Read Hooks ───

export function useTransactions(startDate: number | undefined, endDate: number | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.transactions.list(`${startDate}/${endDate}`),
    queryFn: () => queries.getTransactions(db, startDate, endDate),
  });
}

export function useTransaction(id: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => queries.getTransactionById(db, id),
    enabled: !!id,
  });
}

export function useRecentTransactions(limit: number = 5) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.transactions.recent(limit),
    queryFn: () => queries.getRecentTransactions(db, limit),
  });
}

export function useMonthSummary(yearMonth: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.monthSummary.byMonth(yearMonth),
    queryFn: () => queries.getMonthSummary(db, yearMonth),
  });
}

// ─── Write Hooks ───

function onError(error: unknown) {
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

export function useCreateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      // fetch rates only if baseAmount is not provided
      const rates = data.baseAmount ? undefined : await getRatesForDate(db, data.date);
      data.amount = amountToCents(data.amount || 0);
      data.baseAmount = data.baseAmount || computeBaseAmount(data.amount || 0, data.currency, data.baseCurrency, rates ?? {});
      return queries.createTransaction(db, data);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateFor(queryClient, 'transaction');
    },
    onError,
  });
}

export function useUpdateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; data: TransactionFormData }) => {
      // fetch rates only if baseAmount is not provided
      const rates = params.data.baseAmount ? undefined : await getRatesForDate(db, params.data.date);
      params.data.amount = amountToCents(params.data.amount || 0);
      params.data.baseAmount = params.data.baseAmount || computeBaseAmount(params.data.amount || 0, params.data.currency, params.data.baseCurrency, rates ?? {});
      return queries.updateTransaction(db, params.id, params.data);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateFor(queryClient, 'transaction');
    },
    onError,
  });
}

export function useDeleteTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.deleteTransaction(db, id),
    onSuccess: () => {
      invalidateFor(queryClient, 'transaction');
    },
    onError,
  });
}

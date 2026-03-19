import type { TransactionFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import { computeBaseAmount } from '@/features/currencies/conversion';
import { getRatesForDate } from '@/features/currencies/queries';
import { amountToCents } from '@/features/formatting/helpers';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { getAppState } from '@/lib/store';

import * as queries from './queries';

// ─── Read Hooks ───

export function useTransactions(startDate: number, endDate: number) {
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

export function useCreateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const preferredCurrency = getAppState().currency;
      const rates = await getRatesForDate(db, data.date);
      const amountCents = amountToCents(data.amount || 0);
      const baseAmount = computeBaseAmount(amountCents, data.currency, preferredCurrency, rates);
      return queries.createTransaction(db, data, baseAmount, preferredCurrency);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateFor(queryClient, 'transaction');
    },
  });
}

export function useUpdateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; data: TransactionFormData }) => {
      const preferredCurrency = getAppState().currency;
      const rates = await getRatesForDate(db, params.data.date);
      const amountCents = amountToCents(params.data.amount || 0);
      const baseAmount = computeBaseAmount(amountCents, params.data.currency, preferredCurrency, rates);
      return queries.updateTransaction(db, params.id, params.data, baseAmount, preferredCurrency);
    },
    onSuccess: () => {
      invalidateFor(queryClient, 'transaction');
    },
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
  });
}

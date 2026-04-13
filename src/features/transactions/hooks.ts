import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from '../currencies';

import type { TransactionFormData, TransactionInsertData } from './types';
import type { RatesMap } from '@/features/currencies/queries';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from '@/components/ui';
import { computeBaseAmount } from '@/features/currencies/conversion';
import { getRatesForDate, getRatesForDates } from '@/features/currencies/queries';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import { translate } from '@/lib/i18n';
import { useAppStore } from '../../lib/store';
import { amountToCents } from '../formatting/helpers';
import * as queries from './queries';

// ─── Read Hooks ───

export function transactionsQueryOptions(db: SQLiteDatabase, startDate: number | undefined, endDate: number | undefined) {
  return {
    queryKey: queryKeys.transactions.list(`${startDate}/${endDate}`),
    queryFn: () => queries.getTransactions(db, startDate, endDate),
  };
}
export function useTransactions(startDate: number | undefined, endDate: number | undefined) {
  const db = useSQLiteContext();
  return useQuery(transactionsQueryOptions(db, startDate, endDate));
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
  if (error instanceof Error) captureError(error, { context: 'transactions' });
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

function prepareTransactionData(
  item: TransactionFormData,
  rates: RatesMap | undefined,
  baseCurrency: CurrencyKey,
): TransactionInsertData {
  const amount = item.amount || 0;
  return {
    ...item,
    amount: amountToCents(amount),
    baseAmount: amount === 0 ? 0 : (item.baseAmount ? amountToCents(item.baseAmount) : computeBaseAmount(amountToCents(amount), item.currency, baseCurrency, rates ?? {})),
    baseCurrency,
  };
}

export async function prepareTransactionsForInsert(
  db: SQLiteDatabase,
  items: TransactionFormData[],
): Promise<TransactionInsertData[]> {
  const datesNeedingRates = new Set<number>();
  for (const item of items) {
    // add only dates that need rates (without baseAmount)
    if (!item.baseAmount) datesNeedingRates.add(item.date);
  }
  const ratesByDate = await getRatesForDates(db, Array.from(datesNeedingRates));
  const baseCurrency = useAppStore.getState().currency;
  return items.map((item) => {
    const rates = item.baseAmount ? undefined : ratesByDate.get(item.date);
    return prepareTransactionData(item, rates, baseCurrency);
  });
}

export function useCreateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const baseCurrency = useAppStore.getState().currency;
      // fetch rates only if baseAmount is not provided
      const rates = data.baseAmount ? undefined : await getRatesForDate(db, data.date);
      return queries.createTransaction(db, prepareTransactionData(data, rates, baseCurrency));
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateFor(queryClient, 'transaction');
    },
    onError,
  });
}

export function useCreateTransactions(onSuccess?: (data: string[]) => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: TransactionFormData[]) => {
      const prepared = await prepareTransactionsForInsert(db, items);
      return queries.createTransactions(db, prepared);
    },
    onSuccess: (data) => {
      onSuccess?.(data);
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
      const baseCurrency = useAppStore.getState().currency;
      // fetch rates only if baseAmount is not provided
      const rates = params.data.baseAmount ? undefined : await getRatesForDate(db, params.data.date);
      const prepared = prepareTransactionData(params.data, rates, baseCurrency);
      return queries.updateTransaction(db, params.id, prepared);
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

import type { SQLiteDatabase } from 'expo-sqlite';

import type { TransactionFormData, TransactionInsertData } from '../types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from '@/components/ui';
import { CircleAlert, TrashIcon } from '@/components/ui/icon';
import { showSnackbar } from '@/components/ui/snackbar';
import { getRatesForDate, getRatesForDates } from '@/features/currencies/queries';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import * as queries from '../queries';

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

export function useHasUserTransactions(enabled = true) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.transactions.exists,
    queryFn: () => queries.hasUserTransactions(db),
    enabled,
  });
}

export function useRecentTransactions(limit: number = 5) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.transactions.recent(limit),
    queryFn: () => queries.getRecentTransactions(db, limit),
  });
}

export function useTagNames() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => queries.getTagNames(db),
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

function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return translate('common.error_description');
  return error.message === queries.TRANSFER_LEG_ROUNDS_TO_ZERO ? translate('transactions.transfer_leg_zero') : error.message;
}

function onError(error: unknown) {
  if (error instanceof Error) captureError(error, { context: 'transactions' });
  Alert.alert(translate('common.error'), errorMessage(error));
}

function onUndoError(error: unknown) {
  if (error instanceof Error) captureError(error, { context: 'transactions' });
  showSnackbar({ title: translate('common.undo_failed'), icon: CircleAlert });
}

function ratesForForm(db: SQLiteDatabase, data: TransactionFormData) {
  return (data.type === 'transfer' && data.to_account_id) || !data.baseAmount ? getRatesForDate(db, data.date) : Promise.resolve(undefined);
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
    return queries.prepareTransactionData(item, rates, baseCurrency);
  });
}

export function useCreateTransaction(onSuccess?: (transactionId: string) => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const rates = await ratesForForm(db, data);
      return queries.createTransactionFromForm(db, data, rates, useAppStore.getState().currency);
    },
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateFor(queryClient, 'transaction');
      onSuccess?.(data);
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

export function useUpdateTransaction(onSuccess?: (transactionId: string) => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; data: TransactionFormData }) => {
      const rates = await ratesForForm(db, params.data);
      return queries.updateTransactionFromForm(db, params, rates, useAppStore.getState().currency);
    },
    onSuccess: (_, vars) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateFor(queryClient, 'transaction');
      onSuccess?.(vars.id);
    },
    onError,
  });
}

export function useDuplicateTransfer() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transferId: string) => queries.duplicateTransfer(db, transferId),
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

function useRestoreTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deleted: queries.DeletedTransaction) => queries.restoreTransaction(db, deleted),
    onSuccess: () => {
      invalidateFor(queryClient, 'transaction', 'scheduledTransaction');
    },
    onError: onUndoError,
  });
}

/** Single delete with an Undo snackbar; hook-level callbacks so it still fires after the screen unmounts. */
export function useDeleteTransactionWithUndo() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const restore = useRestoreTransaction();

  return useMutation({
    mutationFn: (id: string) => queries.deleteTransaction(db, id),
    onSuccess: (deleted) => {
      invalidateFor(queryClient, 'transaction');
      if (deleted.transactions.length === 0) return;
      showSnackbar({ title: translate('transactions.deleted'), icon: TrashIcon, undo: () => restore.mutate(deleted) });
    },
    onError,
  });
}

export function useDeleteTransactions(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => queries.deleteTransactions(db, ids),
    onSuccess: () => {
      invalidateFor(queryClient, 'transaction');
      onSuccess?.();
    },
    onError,
  });
}

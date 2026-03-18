import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { ScheduledTransactionFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';

import { todayUnix } from '@/features/formatting/helpers';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import * as queries from './queries';

import { processDueScheduledTransactions } from './scheduler';

export async function syncDueScheduledTransactions(
  db: SQLiteDatabase,
  queryClient: QueryClient,
  today: number = todayUnix(),
): Promise<number> {
  const result = await processDueScheduledTransactions(db, today);

  if (result.createdTransactions > 0 || result.updatedRules > 0) {
    invalidateFor(queryClient, 'scheduledTransaction', 'transaction');
  }

  return result.createdTransactions;
}

export function useScheduledTransactions() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.scheduledTransactions.all,
    queryFn: () => queries.getScheduledTransactions(db),
  });
}

export function useScheduledTransaction(id: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.scheduledTransactions.detail(id),
    queryFn: () => queries.getScheduledTransactionById(db, id),
    enabled: !!id,
  });
}

export function useCreateScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduledTransactionFormData) =>
      queries.createScheduledTransaction(db, data),
    onSuccess: async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      invalidateFor(queryClient, 'scheduledTransaction');
      await syncDueScheduledTransactions(db, queryClient);
    },
  });
}

export function useUpdateScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: ScheduledTransactionFormData }) =>
      queries.updateScheduledTransaction(db, params.id, params.data),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduledTransactions.detail(variables.id),
      });
      invalidateFor(queryClient, 'scheduledTransaction');
      await syncDueScheduledTransactions(db, queryClient);
    },
  });
}

export function useDeleteScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.deleteScheduledTransaction(db, id),
    onSuccess: () => {
      invalidateFor(queryClient, 'scheduledTransaction');
    },
  });
}

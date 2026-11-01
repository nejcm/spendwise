import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { ScheduledTransactionFormData } from './types';
import type { CurrencyKey } from '@/features/currencies';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { Alert } from '@/components/ui';
import { CircleAlert, TrashIcon } from '@/components/ui/icon';
import { showSnackbar } from '@/components/ui/snackbar';
import { computeBaseAmount } from '@/features/currencies/conversion';
import { useCurrencyRates } from '@/features/currencies/hooks';
import { todayUnix } from '@/features/formatting/helpers';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { translate } from '@/lib/i18n';
import { getAppState, updateNotifications, useAppStore } from '@/lib/store/store';
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

export function useRuleForTransaction(transactionId: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.scheduledTransactions.forTransaction(transactionId),
    queryFn: () => queries.getRuleForTransaction(db, transactionId),
    enabled: !!transactionId,
  });
}

/** Rule amount in Preferred Currency at the latest cached rates; null when a needed rate is missing. */
export function useToPreferred() {
  const { data: rates } = useCurrencyRates();
  const preferred = useAppStore.use.currency();
  return useCallback((cents: number, currency: CurrencyKey) => {
    if (currency === preferred) return cents;
    const known = (c: CurrencyKey) => c === 'EUR' || rates?.[c] != null;
    return rates && known(currency) && known(preferred) ? computeBaseAmount(cents, currency, preferred, rates) : null;
  }, [rates, preferred]);
}

const RULE_PAYMENTS_LIMIT = 3;

export function useRulePayments(ruleId: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.scheduledTransactions.payments(ruleId),
    queryFn: () => queries.getRulePayments(db, ruleId, RULE_PAYMENTS_LIMIT),
    enabled: !!ruleId,
  });
}

function onError(error: unknown) {
  if (error instanceof queries.RuleAccountArchivedError) {
    Alert.alert(translate('common.error'), translate('scheduled.resume_archived_account'));
    return;
  }
  if (error instanceof Error) captureError(error, { context: 'scheduled-transactions' });
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
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
    onError,
  });
}

export function useUpdateScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: ScheduledTransactionFormData }) =>
      queries.updateScheduledTransaction(db, params.id, params.data),
    onSuccess: async (_, variables) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({
        queryKey: queryKeys.scheduledTransactions.detail(variables.id),
      });
      invalidateFor(queryClient, 'scheduledTransaction');
      await syncDueScheduledTransactions(db, queryClient);
    },
    onError,
  });
}

export function setBillRuleMuted(ruleId: string, muted: boolean) {
  const rest = (getAppState().notifications.mutedBillRules ?? []).filter((id) => id !== ruleId);
  updateNotifications({ mutedBillRules: muted ? [...rest, ruleId] : rest });
}

type RuleRestore = { deleted: queries.DeletedScheduledTransaction; wasMuted: boolean };

function useRestoreScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deleted, wasMuted }: RuleRestore) => {
      const ruleId = deleted.rule?.id;
      // Re-mute before the row exists again, so no reminder check can see it unmuted.
      if (wasMuted && ruleId) setBillRuleMuted(ruleId, true);
      try {
        await queries.restoreScheduledTransaction(db, deleted);
      }
      catch (error) {
        if (wasMuted && ruleId) setBillRuleMuted(ruleId, false);
        throw error;
      }
    },
    onSuccess: async () => {
      invalidateFor(queryClient, 'scheduledTransaction', 'transaction');
      await syncDueScheduledTransactions(db, queryClient);
    },
    onError: (error) => {
      if (error instanceof Error) captureError(error, { context: 'scheduled-transactions' });
      showSnackbar({ title: translate('common.undo_failed'), icon: CircleAlert });
    },
  });
}

/** Deletes with an Undo snackbar; hook-level callbacks so it still fires after the screen unmounts. */
export function useDeleteScheduledTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const restore = useRestoreScheduledTransaction();

  return useMutation({
    mutationFn: (id: string) => queries.deleteScheduledTransaction(db, id),
    onSuccess: (deleted, id) => {
      invalidateFor(queryClient, 'scheduledTransaction');
      if (!deleted.rule) return;
      const wasMuted = !!getAppState().notifications.mutedBillRules?.includes(id);
      if (wasMuted) setBillRuleMuted(id, false);
      showSnackbar({ title: translate('scheduled.deleted'), icon: TrashIcon, undo: () => restore.mutate({ deleted, wasMuted }) });
    },
    onError,
  });
}

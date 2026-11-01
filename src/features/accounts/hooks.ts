import type { AccountFormData, FirstAccountData } from './types';
import type { CurrencyKey } from '@/features/currencies';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { useCallback } from 'react';
import { Alert } from '@/components/ui';
import { toggleScopeAccount } from '@/features/ai/helpers';
import { getAiScope, setAiScope } from '@/features/ai/store';
import { translateCount } from '@/features/categories/helpers';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import { translate } from '@/lib/i18n';
import { getAppState, setTransactionFormPrefs, useAppStore } from '@/lib/store/store';
import * as queries from './queries';

// ─── Read Hooks ───

export function useAccounts() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.all,
    queryFn: () => queries.getAccounts(db),
  });
}

export function useAccountsWithBalance() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.withBalance,
    queryFn: () => queries.getAccountsWithBalance(db),
  });
}

export function useBalanceSeries(startDate: number, endDate: number, accountId?: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.balanceSeries(startDate, endDate, accountId),
    queryFn: () => queries.getBalanceSeries(db, startDate, endDate, accountId),
  });
}

export function useAccountNetChanges(startDate: number, endDate: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.netChanges(startDate, endDate),
    queryFn: () => queries.getAccountNetChanges(db, startDate, endDate),
  });
}

export function useArchivedAccounts() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.archived,
    queryFn: () => queries.getArchivedAccounts(db),
  });
}

export function useAccountUsage(id: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.usage(id ?? ''),
    queryFn: () => queries.getAccountUsage(db, id!),
    enabled: !!id,
  });
}

export function useAccountFlows(accountId: string, startDate: number | undefined, endDate: number | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.summaryForRange(accountId, startDate, endDate),
    queryFn: () => queries.getAccountFlows(db, accountId, startDate, endDate),
  });
}

export function useTotalBalance(yearMonth?: string) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: yearMonth
      ? queryKeys.accounts.totalBalanceForMonth(yearMonth)
      : queryKeys.accounts.totalBalance,
    queryFn: () => queries.getTotalBalance(db, yearMonth),
  });
}

// ─── Write Hooks ───

function onError(error: unknown) {
  if (error instanceof queries.AccountInUseError) {
    Alert.alert(translate('common.error'), translate('accounts.delete_blocked'));
    return;
  }
  if (error instanceof Error) captureError(error, { context: 'accounts' });
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

export function useCreateAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountFormData) => queries.createAccount(db, data, useAppStore.getState().currency),
    onSuccess: () => {
      invalidateFor(queryClient, 'account', 'transaction');
    },
    onError,
  });
}

export function useUpdateAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: AccountFormData }) =>
      queries.updateAccount(db, params.id, params.data),
    onSuccess: () => {
      invalidateFor(queryClient, 'account');
    },
    onError,
  });
}

export function useSetupFirstAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { data: FirstAccountData | null; preferredCurrency: CurrencyKey }) =>
      queries.setupFirstAccount(db, params.data, params.preferredCurrency),
    onSuccess: () => {
      invalidateFor(queryClient, 'account', 'transaction');
    },
    onError,
  });
}

export function useUpdateAccountOrder() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ id: string; sort_order: number }>) =>
      queries.updateAccountOrder(db, items),
    onSuccess: () => {
      invalidateFor(queryClient, 'account');
    },
    onError: (error) => {
      onError(error);
      invalidateFor(queryClient, 'account');
    },
  });
}

export function useArchiveAccount(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.archiveAccount(db, id),
    onSuccess: (_, id) => {
      forgetFormAccount(id);
      invalidateFor(queryClient, 'account', 'scheduledTransaction');
      onSuccess?.();
    },
    onError,
  });
}

export function useUnarchiveAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.unarchiveAccount(db, id),
    onSuccess: () => {
      invalidateFor(queryClient, 'account');
    },
    onError,
  });
}

function forgetFormAccount(id: string) {
  const prefs = getAppState().formPrefs.transactionForm;
  if (prefs.account_id === id) setTransactionFormPrefs({ ...prefs, account_id: undefined });
}

function forgetAccount(id: string) {
  forgetFormAccount(id);
  const scope = getAiScope();
  if (scope.accountIds !== 'all' && scope.accountIds.includes(id)) {
    setAiScope({ ...scope, accountIds: toggleScopeAccount(scope.accountIds, id) });
  }
}

export function useDeleteAccountConfirmation(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => queries.deleteAccount(db, id),
    onSuccess: (_, id) => {
      forgetAccount(id);
      invalidateFor(queryClient, 'account', 'transaction');
      onSuccess?.();
    },
    onError,
  });
  const submit = useCallback((id: string, name: string) => {
    Alert.alert(
      translate('accounts.delete_account'),
      translate('accounts.delete_confirm', { name }),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        { text: translate('common.delete'), style: 'destructive', onPress: () => mutation.mutate(id) },
      ],
    );
  }, [mutation]);

  return { mutation, submit };
}

export function useArchiveAccountConfirmation(onSuccess?: () => void) {
  const mutation = useArchiveAccount(onSuccess);
  const submit = useCallback((id: string, name?: string, activeRules = 0) => {
    if (!id) return;
    const pauses = activeRules > 0 ? ` ${translateCount('accounts.archive_pauses_rules', activeRules)}` : '';
    Alert.alert(
      translate('accounts.archive_account'),
      translate('accounts.archive_confirm', { name: name ?? '' }) + pauses,
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('accounts.archive_action'),
          style: 'destructive',
          onPress: async () => {
            mutation.mutate(id);
          },
        },
      ],
    );
  }, [mutation]);

  return { mutation, submit };
}

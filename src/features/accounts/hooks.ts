import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountFormData } from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { useCallback } from 'react';
import { Alert } from '@/components/ui';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import { translate } from '@/lib/i18n';
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

export function accountsWithBalanceForRangeQueryOptions(db: SQLiteDatabase, startDate: number | undefined, endDate: number | undefined) {
  return {
    queryKey: queryKeys.accounts.withBalanceForRange(startDate, endDate),
    queryFn: () => queries.getAccountsWithBalanceForRange(db, startDate, endDate),
  };
}
export function useAccountsWithBalanceForRange(startDate: number | undefined, endDate: number | undefined) {
  const db = useSQLiteContext();
  return useQuery(accountsWithBalanceForRangeQueryOptions(db, startDate, endDate));
}

export function useAccountSummaryByRange(
  accountId: string | undefined,
  startDate: number | undefined,
  endDate: number | undefined,
) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.summaryForRange(accountId, startDate, endDate),
    queryFn: () => queries.getAccountSummaryByRange(db, accountId!, startDate, endDate),
    enabled: !!accountId,
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
  if (error instanceof Error) captureError(error, { context: 'accounts' });
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

export function useCreateAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AccountFormData) => queries.createAccount(db, data),
    onSuccess: () => {
      invalidateFor(queryClient, 'account');
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

export function useArchiveAccount(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.archiveAccount(db, id),
    onSuccess: () => {
      invalidateFor(queryClient, 'account');
      onSuccess?.();
    },
    onError,
  });
}

export function useArchiveAccountConfirmation(onSuccess?: () => void) {
  const mutation = useArchiveAccount(onSuccess);
  const submit = useCallback((id: string, name?: string) => {
    if (!id) return;
    Alert.alert(
      translate('common.delete'),
      translate('accounts.delete_confirm', { name: name ?? '' }),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.delete'),
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

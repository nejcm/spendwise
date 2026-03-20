import type { AccountFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import Alert from '@/components/ui/alert';
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

export function useAccountsWithBalanceForRange(startDate: number, endDate: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.withBalanceForRange(startDate, endDate),
    queryFn: () => queries.getAccountsWithBalanceForRange(db, startDate, endDate),
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

export function useArchiveAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.archiveAccount(db, id),
    onSuccess: () => {
      invalidateFor(queryClient, 'account');
    },
    onError,
  });
}

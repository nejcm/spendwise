import type { SQLiteDatabase } from 'expo-sqlite';

import type { AccountFormData } from './types';
import type { CurrencyKey } from '@/features/currencies';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { useCallback, useMemo } from 'react';
import { Alert } from '@/components/ui';
import { useCurrencyRates } from '@/features/currencies/hooks';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import * as queries from './queries';
import { computeAccountSummaryForViewCurrency } from './summary-conversion';

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
  options?: { enabled?: boolean },
) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.summaryForRange(accountId, startDate, endDate),
    queryFn: () => queries.getAccountSummaryByRange(db, accountId!, startDate, endDate),
    enabled: (options?.enabled ?? true) && !!accountId,
  });
}

export function useAccountSummaryNativeByRange(
  accountId: string | undefined,
  startDate: number | undefined,
  endDate: number | undefined,
  options?: { enabled?: boolean },
) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.accounts.summaryNativeForRange(accountId, startDate, endDate),
    queryFn: () => queries.getAccountSummaryNativeByRange(db, accountId!, startDate, endDate),
    enabled: (options?.enabled ?? true) && !!accountId,
  });
}

export function useAccountSummaryDisplay(
  accountId: string | undefined,
  startDate: number | undefined,
  endDate: number | undefined,
  viewCurrency: CurrencyKey,
) {
  const preferredCurrency = useAppStore.use.currency();
  const isPreferredView = viewCurrency === preferredCurrency;

  const preferredQuery = useAccountSummaryByRange(accountId, startDate, endDate, {
    enabled: isPreferredView,
  });
  const nativeQuery = useAccountSummaryNativeByRange(accountId, startDate, endDate, {
    enabled: !isPreferredView,
  });
  const ratesQuery = useCurrencyRates({ enabled: !isPreferredView });
  const ratesReady = !ratesQuery.isLoading && !ratesQuery.isPending;

  const data = useMemo(() => {
    if (isPreferredView) return preferredQuery.data;
    if (!nativeQuery.data || !ratesReady) return undefined;
    return computeAccountSummaryForViewCurrency(nativeQuery.data, viewCurrency, ratesQuery.data ?? {});
  }, [isPreferredView, nativeQuery.data, preferredQuery.data, ratesQuery.data, ratesReady, viewCurrency]);

  const isLoading = isPreferredView
    ? preferredQuery.isLoading
    : nativeQuery.isLoading || !ratesReady;

  const isError = isPreferredView
    ? preferredQuery.isError
    : nativeQuery.isError || ratesQuery.isError;

  return { data, isLoading, isError };
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

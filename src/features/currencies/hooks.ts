import type { CurrencyKey } from './';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { Alert } from '@/components/ui';
import { writeAutoBackupFile } from '@/features/imports-export/backup-file';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { translate } from '@/lib/i18n';
import { setCurrency } from '@/lib/store/store';

import * as queries from './queries';
import { recalculateAllBaseAmounts } from './recalculate';

const STALE_MS = 24 * 60 * 60_000; // 24 hours

/** Historical EUR-based rates for the closest stored day to `dateUnix` (for transaction-date conversion). */
export function useRatesForDate(dateUnix: number | null) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.currencyRates.forDate(dateUnix ?? 0),
    queryFn: () => queries.getRatesForDate(db, dateUnix!),
    enabled: dateUnix != null && Number.isFinite(dateUnix),
    staleTime: STALE_MS,
  });
}

export function useCurrencyRates() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.currencyRates.all,
    queryFn: () => queries.loadOrFetchRates(db),
    staleTime: STALE_MS,
  });
}

function onError(error: unknown) {
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

export function useRefreshRates() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => queries.refreshRates(db),
    onSuccess: () => {
      invalidateFor(queryClient, 'currencyRates');
    },
    onError,
  });
}

/**
 * Mutation for changing the user's preferred display currency.
 *
 * Recalculates baseAmount on all transactions using historical rates, then
 * updates the Zustand store and invalidates all affected caches.
 * Show a loading indicator and warning before calling mutate().
 */
export function useChangeCurrency() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCurrency: CurrencyKey) => {
      try {
        await writeAutoBackupFile(db);
      }
      catch {
        Alert.alert(
          translate('settings.currencyBackupFailedTitle'),
          translate('settings.currencyBackupFailedMessage'),
        );
      }
      await recalculateAllBaseAmounts(db, newCurrency);
      setCurrency(newCurrency);
    },
    onSuccess: () => {
      invalidateFor(queryClient, 'transaction', 'account');
      queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthSummary.all });
    },
    onError,
  });
}

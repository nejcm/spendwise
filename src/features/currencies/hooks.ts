import type { CurrencyKey } from './';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { Alert } from '@/components/ui';
import { writeAutoBackupFile } from '@/features/imports-export/backup-file';
import { hasTransactions } from '@/features/transactions/queries';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryTimes } from '@/lib/data/query-helpers';
import { queryKeys } from '@/lib/data/query-keys';
import { time } from '@/lib/date/constants';

import { translate } from '@/lib/i18n';
import * as queries from './queries';
import { changePreferredCurrency } from './recalculate';

/** Historical EUR-based rates for the closest stored day to `dateUnix` (for transaction-date conversion). */
export function useRatesForDate(dateUnix: number | null) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.currencyRates.forDate(dateUnix ?? 0),
    queryFn: () => queries.getRatesForDate(db, dateUnix!),
    enabled: dateUnix != null && Number.isFinite(dateUnix),
    // Short: a missed fetch caches a closest-date fallback, which must not
    // outlive the next chance to fetch the real rates for that day.
    ...queryTimes(time['1h']),
  });
}

export function useCurrencyRates(options?: { enabled?: boolean }) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.currencyRates.all,
    queryFn: () => queries.loadOrFetchRates(db),
    enabled: options?.enabled ?? true,
    ...queryTimes(time['8h']),
  });
}

export function useLastCurrencyRatesFetchedAt() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.currencyRates.lastFetchedAt,
    queryFn: () => queries.getLastFetchedAt(db),
    ...queryTimes(time['8h']),
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
 * Recalculates baseAmount on all transactions using historical rates and sets
 * Preferred Currency in one write, then invalidates all affected caches.
 * Show a loading indicator and warning before calling mutate().
 */
export function useChangeCurrency() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCurrency: CurrencyKey) => {
      if (await hasTransactions(db)) {
        try {
          await writeAutoBackupFile(db);
        }
        catch {
          Alert.alert(
            translate('settings.currencyBackupFailedTitle'),
            translate('settings.currencyBackupFailedMessage'),
          );
        }
      }
      await changePreferredCurrency(db, newCurrency);
    },
    onSuccess: () => {
      invalidateFor(queryClient, 'transaction', 'account');
    },
    onError,
  });
}

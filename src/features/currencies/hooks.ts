import type { CurrencyKey } from './';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { setCurrency } from '@/lib/store';

import * as queries from './queries';
import { recalculateAllBaseAmounts } from './recalculate';

const STALE_MS = 24 * 60 * 60_000; // 24 hours

export function useCurrencyRates() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.currencyRates.all,
    queryFn: () => queries.loadOrFetchRates(db),
    staleTime: STALE_MS,
  });
}

export function useRefreshRates() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => queries.refreshRates(db),
    onSuccess: () => {
      invalidateFor(queryClient, 'currencyRates');
    },
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
      await recalculateAllBaseAmounts(db, newCurrency);
      setCurrency(newCurrency);
    },
    onSuccess: () => {
      invalidateFor(queryClient, 'transaction', 'account', 'budget');
      queryClient.invalidateQueries({ queryKey: queryKeys.insights.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monthSummary.all });
    },
  });
}

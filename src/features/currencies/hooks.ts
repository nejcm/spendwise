import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';

import * as queries from './queries';

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

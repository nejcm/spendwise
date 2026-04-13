import type { FetchQueryOptions } from '@tanstack/react-query';
import type { PeriodSelection } from '@/lib/store';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { getPeriodRange, isNavigablePeriodMode, navigatePeriod } from '@/lib/date/helpers';

export function usePrefetchAdjacentPeriods<TOptions extends FetchQueryOptions>(
  selection: PeriodSelection,
  prefetch: (start: number | undefined, end: number | undefined) => TOptions,
) {
  const queryClient = useQueryClient();
  const prefetchFnRef = useRef(prefetch);

  useEffect(() => {
    prefetchFnRef.current = prefetch;
  }, [prefetch]);

  useEffect(() => {
    // No need to prefetch for fixed periods
    if (!isNavigablePeriodMode(selection.mode)) return;
    const prev = navigatePeriod(selection, -1);
    const next = navigatePeriod(selection, 1);
    for (const adjacent of [prev, next]) {
      const [start, end] = getPeriodRange(adjacent);
      void queryClient.prefetchQuery(prefetchFnRef.current(start, end));
    }
  }, [queryClient, selection]);
}

/**
 * React Query cache durations for a query whose data is only worth keeping for
 * as long as it is worth trusting: `gcTime` tracks `staleTime`, so nothing
 * lingers in memory past the point where it would be refetched anyway.
 *
 * Keep `time` short for anything that can cache a degraded/offline fallback.
 */
export function queryTimes(time: number) {
  return {
    staleTime: time,
    gcTime: time,
  };
}

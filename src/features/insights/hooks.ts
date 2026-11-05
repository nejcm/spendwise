import type { SQLiteDatabase } from 'expo-sqlite';
import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { queryKeys } from '@/lib/data/query-keys';

import * as queries from './queries';

export function useActivityCount() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.activityCount,
    queryFn: () => queries.getActivityCount(db),
  });
}

export function useSummaryByRange(startDate: number | undefined, endDate: number | undefined, enabled = true) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.summaryRange(startDate, endDate),
    enabled,
    queryFn: () => queries.getSummaryByRange(db, startDate, endDate),
  });
}

export function categorySpendByRangeQueryOptions(db: SQLiteDatabase, startDate: number | undefined, endDate: number | undefined, enabled = true) {
  return {
    enabled,
    queryKey: queryKeys.insights.categorySpendRange(startDate, endDate),
    queryFn: () => queries.getCategorySpendByRange(db, startDate, endDate),
  };
}
export function useCategorySpendByRange(startDate: number | undefined, endDate: number | undefined, enabled = true) {
  const db = useSQLiteContext();
  return useQuery(categorySpendByRangeQueryOptions(db, startDate, endDate, enabled));
}

function trendByRangeQueryOptions(db: SQLiteDatabase, startDate: number | undefined, endDate: number | undefined) {
  return {
    queryKey: queryKeys.insights.trendRange(startDate, endDate),
    queryFn: () => queries.getTrendByRange(db, startDate, endDate),
  };
}
export function useTrendByRange(startDate: number | undefined, endDate: number | undefined) {
  const db = useSQLiteContext();
  return useQuery(trendByRangeQueryOptions(db, startDate, endDate));
}

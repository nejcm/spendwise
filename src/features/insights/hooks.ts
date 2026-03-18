import { useQuery } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import { queryKeys } from '@/lib/data/query-keys';

import * as queries from './queries';

export function useSummaryByRange(startDate: number, endDate: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.summaryRange(startDate, endDate),
    queryFn: () => queries.getSummaryByRange(db, startDate, endDate),
  });
}

export function useCategorySpendByRange(startDate: number, endDate: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.categorySpendRange(startDate, endDate),
    queryFn: () => queries.getCategorySpendByRange(db, startDate, endDate),
  });
}

export function useTrendByRange(startDate: number, endDate: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.trendRange(startDate, endDate),
    queryFn: () => queries.getTrendByRange(db, startDate, endDate),
  });
}

export function useMonthlyTrend(numMonths: number = 6) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.monthlyTrend(numMonths),
    queryFn: () => queries.getMonthlyTrend(db, numMonths),
  });
}

export function useYearlySummary(year: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.yearlySummary(year),
    queryFn: () => queries.getYearlySummary(db, year),
  });
}

export function useCategorySpendForYear(year: number) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.insights.categorySpendYear(year),
    queryFn: () => queries.getCategorySpendForYear(db, year),
  });
}

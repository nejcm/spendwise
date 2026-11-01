import type { DailyTrendTotal, TrendPoint } from './types';
import type { PeriodMode } from '@/lib/store/store';

import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  subYears,
} from 'date-fns';
import { dateToUnix, getMonthBoundaries, getYearBoundaries, monthOfDay, unixToCalendarDate, unixToISODate } from '@/lib/date/helpers';

type TrendBucket = {
  label: string;
  startDate: string;
  endDate: string;
};

function toIsoDate(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function minDate(left: Date, right: Date) {
  return left.getTime() <= right.getTime() ? left : right;
}

function buildDailyBuckets(startDate: string, endDate: string, shortLabel: boolean): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  const endExclusive = parseISO(endDate);

  for (let cursor = parseISO(startDate); cursor < endExclusive; cursor = addDays(cursor, 1)) {
    const nextDate = addDays(cursor, 1);
    buckets.push({
      label: format(cursor, shortLabel ? 'EEE' : 'MMM d'),
      startDate: toIsoDate(cursor),
      endDate: toIsoDate(nextDate),
    });
  }

  return buckets;
}

function buildWeeklyBuckets(startDate: string, endDate: string, useWeekLabels: boolean): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  const endExclusive = parseISO(endDate);

  let index = 1;
  for (let cursor = parseISO(startDate); cursor < endExclusive; cursor = addDays(cursor, 7)) {
    const nextDate = minDate(addDays(cursor, 7), endExclusive);
    buckets.push({
      label: useWeekLabels ? `W${index}` : format(cursor, 'MMM d'),
      startDate: toIsoDate(cursor),
      endDate: toIsoDate(nextDate),
    });
    index += 1;
  }

  return buckets;
}

function clippedBucket(label: string, [start, end]: [number, number], rangeStart: number, rangeEnd: number): TrendBucket {
  return { label, startDate: unixToISODate(Math.max(start, rangeStart)), endDate: unixToISODate(Math.min(end, rangeEnd)) };
}

function buildMonthlyBuckets(startDate: string, endDate: string): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  const rangeStart = dateToUnix(startDate);
  const rangeEnd = dateToUnix(endDate);
  const first = monthOfDay(rangeStart);
  const labelFormat = first.year === monthOfDay(rangeEnd - 86400).year ? 'MMM' : 'MMM yy';

  for (let month = first.month; ; month += 1) {
    const bounds = getMonthBoundaries(first.year, month);
    if (bounds[0] >= rangeEnd) break;
    buckets.push(clippedBucket(format(unixToCalendarDate(bounds[0]), labelFormat), bounds, rangeStart, rangeEnd));
  }
  return buckets;
}

function buildYearlyBuckets(startDate: string, endDate: string): TrendBucket[] {
  const buckets: TrendBucket[] = [];
  const rangeStart = dateToUnix(startDate);
  const rangeEnd = dateToUnix(endDate);

  for (let year = monthOfDay(rangeStart).year; ; year += 1) {
    const bounds = getYearBoundaries(year);
    if (bounds[0] >= rangeEnd) break;
    buckets.push(clippedBucket(String(year), bounds, rangeStart, rangeEnd));
  }
  return buckets;
}

function buildBuckets(period: PeriodMode, startDate: string, endDate: string): TrendBucket[] {
  const rangeDays = differenceInCalendarDays(parseISO(endDate), parseISO(startDate));

  switch (period) {
    case 'all':
      return buildYearlyBuckets(startDate, endDate);
    case 'year':
    case 'this-year':
      return buildMonthlyBuckets(startDate, endDate);
    case 'month':
    case 'this-month':
      return buildWeeklyBuckets(startDate, endDate, true);
    case 'week':
    case 'this-week':
      return buildDailyBuckets(startDate, endDate, true);
    case 'today':
    case 'day':
      return buildDailyBuckets(startDate, endDate, false);
    case 'custom':
      if (rangeDays <= 7) return buildDailyBuckets(startDate, endDate, false);
      if (rangeDays <= 31) return buildWeeklyBuckets(startDate, endDate, false);
      return buildMonthlyBuckets(startDate, endDate);
  }
}

export function buildTrendSeries(
  period: PeriodMode,
  startDate: number | undefined,
  endDate: number | undefined,
  dailyTotals: DailyTrendTotal[],
): TrendPoint[] {
  let startDateStr = '';
  let endDateStr = '';
  if (!startDate || !endDate) {
    // fallback to last 3 years
    if (dailyTotals.length === 0) {
      const now = new Date();
      startDateStr = subYears(now, 3).toISOString();
      endDateStr = now.toISOString();
    }
    // find min and max date
    else {
      let minDate = Infinity;
      let maxDate = -Infinity;
      for (const total of dailyTotals) {
        if (total.date < minDate) minDate = total.date;
        if (total.date > maxDate) maxDate = total.date;
      }
      startDateStr = unixToISODate(minDate);
      endDateStr = unixToISODate(maxDate + 86400);
    }
  }
  else {
    startDateStr = unixToISODate(startDate);
    endDateStr = unixToISODate(endDate);
  }

  const totalsByDate = new Map(dailyTotals.map((entry) => [unixToISODate(entry.date), entry]));

  return buildBuckets(period, startDateStr, endDateStr).map((bucket) => {
    let income = 0;
    let expense = 0;

    for (
      let cursor = parseISO(bucket.startDate);
      cursor < parseISO(bucket.endDate);
      cursor = addDays(cursor, 1)
    ) {
      const dateKey = toIsoDate(cursor);
      const totals = totalsByDate.get(dateKey);

      if (!totals) {
        continue;
      }

      income += totals.income;
      expense += totals.expense;
    }

    return {
      label: bucket.label,
      income,
      expense,
    };
  });
}

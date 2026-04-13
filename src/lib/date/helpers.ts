import type { DynamicPeriodMode, PeriodMode, PeriodSelection } from '@/lib/store';
import { UTCDate } from '@date-fns/utc';
import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  endOfISOWeek,
  format,
  getDaysInMonth,
  getISOWeek,
  getISOWeeksInYear,
  parse,
  setISOWeek,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import { DYNAMIC_PERIOD_MODES } from '@/lib/store';

export const isDynamicPeriodMode = (mode: PeriodMode): mode is DynamicPeriodMode => DYNAMIC_PERIOD_MODES.includes(mode as DynamicPeriodMode);

export const isNavigablePeriodMode = (mode: PeriodMode) => mode !== 'all' && mode !== 'custom' && mode !== 'today';

/** Convert a Date or yyyy-MM-dd string to Unix seconds (UTC). */
export function dateToUnix(date: Date | string): number {
  if (typeof date === 'string') return Math.floor(new Date(date).getTime() / 1000);
  return Math.floor(date.getTime() / 1000);
}

/** Convert Unix seconds to a Date object. */
export function unixToDate(seconds: number): Date {
  return new Date(seconds * 1000);
}

/** Convert Unix seconds to a yyyy-MM-dd ISO date string. */
export function unixToISODate(seconds: number): string {
  return format(new Date(seconds * 1000), 'yyyy-MM-dd');
}

export function splitBy(
  startDate: string,
  endDate: string,
  chunkSize = 1,
): Array<{ start: string; end: string }> {
  const segments: Array<{ start: string; end: string }> = [];
  const anchor = new UTCDate(`${startDate}T00:00:00Z`);
  const end = new UTCDate(`${endDate}T00:00:00Z`);
  if (anchor > end) return segments;

  for (let i = 0; ; i += 1) {
    const segStart = i === 0 ? anchor : addDays(addYears(anchor, i * chunkSize), 1);
    if (segStart > end) break;
    const chunkEnd = addYears(anchor, (i + 1) * chunkSize);
    const segEnd = chunkEnd <= end ? chunkEnd : end;
    segments.push({
      start: segStart.toISOString().slice(0, 10),
      end: segEnd.toISOString().slice(0, 10),
    });
    if (segEnd.getTime() >= end.getTime()) break;
  }

  return segments;
}

/**
 * Get the start and end of a month as Unix seconds (UTC).
 * @param yearMonth - The year and month in the format "YYYY-MM".
 * @returns An array with the start (inclusive) and end (exclusive) Unix seconds.
 */
export function getCurrentMonthRange(yearMonth: string): [number, number] {
  const parsed = parse(yearMonth, 'yyyy-MM', new Date());
  const monthStart = startOfMonth(parsed);
  const nextMonthStart = addMonths(monthStart, 1);

  return [dateToUnix(monthStart), dateToUnix(nextMonthStart)];
}

export function currentPeriodSelection(): PeriodSelection {
  const now = new Date();
  return { mode: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getPeriodRange(selection: PeriodSelection): [number | undefined, number | undefined] {
  switch (selection.mode) {
    case 'year': {
      const start = startOfYear(new Date(selection.year, 0, 1));
      const end = startOfYear(addYears(start, 1));
      return [dateToUnix(start), dateToUnix(end)];
    }
    case 'month': {
      const monthStart = startOfMonth(new Date(selection.year, selection.month - 1, 1));
      const nextMonthStart = addMonths(monthStart, 1);
      return [dateToUnix(monthStart), dateToUnix(nextMonthStart)];
    }
    case 'week': {
      const weekStart = startOfISOWeek(setISOWeek(startOfYear(new Date(selection.year, 0, 4)), selection.week));
      const weekEnd = addDays(endOfISOWeek(weekStart), 1);
      return [dateToUnix(weekStart), dateToUnix(weekEnd)];
    }
    case 'custom': {
      const end = addDays(new Date(selection.endDate), 1);
      return [dateToUnix(new Date(selection.startDate)), dateToUnix(end)];
    }
    case 'all':
      return [undefined, undefined];
    case 'today': {
      const now = new Date();
      const start = startOfDay(now);
      const end = addDays(start, 1);
      return [dateToUnix(start), dateToUnix(end)];
    }
    case 'this-week': {
      const now = new Date();
      const start = startOfISOWeek(now);
      const end = addDays(endOfISOWeek(now), 1);
      return [dateToUnix(start), dateToUnix(end)];
    }
    case 'this-month': {
      const now = new Date();
      const start = startOfMonth(now);
      const end = addMonths(start, 1);
      return [dateToUnix(start), dateToUnix(end)];
    }
    case 'this-year': {
      const now = new Date();
      const start = startOfYear(now);
      const end = startOfYear(addYears(start, 1));
      return [dateToUnix(start), dateToUnix(end)];
    }
  }
}

export function navigatePeriod(selection: PeriodSelection, dir: -1 | 1): PeriodSelection {
  switch (selection.mode) {
    case 'year':
      return { ...selection, year: selection.year + dir };
    case 'month': {
      const d = addMonths(new Date(selection.year, selection.month - 1, 1), dir);
      return { mode: 'month', year: d.getFullYear(), month: d.getMonth() + 1 };
    }
    case 'week': {
      const weeksInYear = getISOWeeksInYear(new Date(selection.year, 6, 1));
      const nextWeek = selection.week + dir;
      if (nextWeek < 1) {
        const prevYear = selection.year - 1;
        return { mode: 'week', year: prevYear, week: getISOWeeksInYear(new Date(prevYear, 6, 1)) };
      }
      if (nextWeek > weeksInYear) {
        return { mode: 'week', year: selection.year + 1, week: 1 };
      }
      return { ...selection, week: nextWeek };
    }
    case 'custom': {
      const days = differenceInDays(new Date(selection.endDate), new Date(selection.startDate)) + 1;
      const newStart = addDays(new Date(selection.startDate), dir * days);
      const newEnd = addDays(new Date(selection.endDate), dir * days);
      return {
        mode: 'custom',
        startDate: format(newStart, 'yyyy-MM-dd'),
        endDate: format(newEnd, 'yyyy-MM-dd'),
      };
    }
    case 'all':
    case 'today':
      return selection;
    case 'this-week': {
      const { year, week } = currentISOWeek();
      return navigatePeriod({ mode: 'week', year, week }, dir);
    }
    case 'this-month': {
      const now = new Date();
      return navigatePeriod({ mode: 'month', year: now.getFullYear(), month: now.getMonth() + 1 }, dir);
    }
    case 'this-year': {
      const now = new Date();
      return navigatePeriod({ mode: 'year', year: now.getFullYear() }, dir);
    }
  }
}

export function getWeeksInYear(year: number): { week: number; start: Date; end: Date }[] {
  const count = getISOWeeksInYear(new Date(year, 6, 1));
  return Array.from({ length: count }, (_, i) => {
    const week = i + 1;
    const start = startOfISOWeek(setISOWeek(startOfYear(new Date(year, 0, 4)), week));
    const end = endOfISOWeek(start);
    return { week, start, end };
  });
}

export function currentISOWeek(): { year: number; week: number } {
  const now = new Date();
  return { year: now.getFullYear(), week: getISOWeek(now) };
}

const AVERAGE_DAYS_PER_MONTH = 365.25 / 12;

/**
 * Scale a monthly budget amount to match the given period selection.
 * Returns the prorated budget in the same unit (cents) as the input.
 */
export function scaleBudgetForPeriod(monthlyBudget: number, selection: PeriodSelection): number | undefined {
  if (selection.mode === 'all') return undefined;
  if ((DYNAMIC_PERIOD_MODES).includes(selection.mode as DynamicPeriodMode)) {
    const [startUnix, endUnix] = getPeriodRange(selection) as [number, number];
    const daysInPeriod = (endUnix - startUnix) / 86400;
    const daysInMonth = getDaysInMonth(unixToDate(startUnix));
    return Math.round(monthlyBudget * daysInPeriod / daysInMonth);
  }
  if (selection.mode === 'month') return monthlyBudget;

  const [startUnix, endUnix] = getPeriodRange(selection) as [number, number];
  const daysInPeriod = (endUnix - startUnix) / 86400;

  let daysInMonth: number = 30;
  switch (selection.mode) {
    case 'year':
      daysInMonth = daysInPeriod / 12;
      break;
    case 'week':
      daysInMonth = getDaysInMonth(unixToDate(startUnix));
      break;
    case 'custom': {
      const s = new Date(selection.startDate);
      const e = new Date(selection.endDate);
      const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
      daysInMonth = sameMonth ? getDaysInMonth(s) : AVERAGE_DAYS_PER_MONTH;
      break;
    }
  }

  return Math.round(monthlyBudget * daysInPeriod / daysInMonth);
}

export function tryFormatDate(date: string, dateFormat = 'yyyy-MM-dd') {
  try {
    return format(date, dateFormat);
  }
  catch (err) {
    console.error('Error formatting date', err);
    return undefined;
  }
}

/**
 * Binary-searches a sorted array of Unix timestamps to find the closest one
 * to `target`. Returns `undefined` if the closest is beyond `toleranceSec`.
 * Ties resolve to the earlier date.
 */
export function findClosestDateBinary(
  sortedDates: number[],
  target: number,
  toleranceSec: number,
): number | undefined {
  if (sortedDates.length === 0) return undefined;

  let lo = 0;
  let hi = sortedDates.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedDates[mid] < target) lo = mid + 1;
    else hi = mid;
  }

  // lo is the first date >= target. Compare with lo and lo-1 to find nearest.
  const after = sortedDates[lo];
  const before = lo > 0 ? sortedDates[lo - 1] : undefined;

  const best = before === undefined
    ? after
    : (target - before) <= (after - target) ? before : after;

  return Math.abs(best - target) <= toleranceSec ? best : undefined;
}

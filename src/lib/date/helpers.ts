import type { PeriodSelection } from '@/lib/store';
import {
  addDays,
  addMonths,
  addYears,
  differenceInDays,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeeksInYear,
  parse,
  setISOWeek,
  startOfISOWeek,
  startOfMonth,
  startOfYear,
} from 'date-fns';

/**
 * Get the start and end date of a month.
 * @param yearMonth - The year and month in the format "YYYY-MM".
 * @returns An array with the start and end date of the month.
 */
export function getCurrentMonthRange(yearMonth: string): [string, string] {
  const parsed = parse(yearMonth, 'yyyy-MM', new Date());
  const monthStart = startOfMonth(parsed);
  const nextMonthStart = addMonths(monthStart, 1);

  const startDate = format(monthStart, 'yyyy-MM-dd');
  const nextMonth = format(nextMonthStart, 'yyyy-MM-dd');

  return [startDate, nextMonth];
}

export function currentPeriodSelection(): PeriodSelection {
  const now = new Date();
  return { mode: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getPeriodRange(selection: PeriodSelection): [string, string] {
  switch (selection.mode) {
    case 'year': {
      const start = startOfYear(new Date(selection.year, 0, 1));
      const end = startOfYear(addYears(start, 1));
      return [format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd')];
    }
    case 'month': {
      const monthStart = startOfMonth(new Date(selection.year, selection.month - 1, 1));
      const nextMonthStart = addMonths(monthStart, 1);
      return [format(monthStart, 'yyyy-MM-dd'), format(nextMonthStart, 'yyyy-MM-dd')];
    }
    case 'week': {
      const weekStart = startOfISOWeek(setISOWeek(startOfYear(new Date(selection.year, 0, 4)), selection.week));
      const weekEnd = addDays(endOfISOWeek(weekStart), 1);
      return [format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')];
    }
    case 'custom': {
      const end = format(addDays(new Date(selection.endDate), 1), 'yyyy-MM-dd');
      return [selection.startDate, end];
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
  }
}

export function getPeriodLabel(selection: PeriodSelection): string {
  switch (selection.mode) {
    case 'year':
      return String(selection.year);
    case 'month': {
      const d = new Date(selection.year, selection.month - 1, 1);
      return format(d, 'MMMM yyyy');
    }
    case 'week': {
      const weekStart = startOfISOWeek(setISOWeek(startOfYear(new Date(selection.year, 0, 4)), selection.week));
      const weekEnd = endOfISOWeek(weekStart);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;
    }
    case 'custom': {
      const start = new Date(selection.startDate);
      const end = new Date(selection.endDate);
      if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
      }
      return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
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

export function tryFormatDate(date: string, dateFormat = 'yyyy-MM-dd') {
  try {
    return format(date, dateFormat);
  }
  catch (_) {
    return undefined;
  }
}

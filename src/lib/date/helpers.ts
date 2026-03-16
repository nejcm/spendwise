import { addMonths, format, parse, startOfMonth } from 'date-fns';

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

export function tryFormatDate(date: string, dateFormat = 'yyyy-MM-dd') {
  try {
    return format(date, dateFormat);
  }
  catch (_) {
    return undefined;
  }
}

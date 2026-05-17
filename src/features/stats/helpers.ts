import type { GlobalBudget } from './global-budget-queries';
import type { BudgetPeriodSelection, MonthSlice } from './types';
import {
  addDays,
  format,
  getDaysInMonth,
  getDaysInYear,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
} from 'date-fns';
import { dateToUnix, getMonthBoundaries } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';

const MAX_MONTH_SLICES = 36;

export function expandToMonthSlices(selection: BudgetPeriodSelection): MonthSlice[] {
  if (selection.mode === 'day') {
    const date = parseISO(selection.date);
    return [{ year: date.getFullYear(), month: date.getMonth() + 1 }];
  }
  if (selection.mode === 'month') {
    return [{ year: selection.year, month: selection.month }];
  }
  if (selection.mode === 'year') {
    return Array.from({ length: 12 }, (_, i) => ({ year: selection.year, month: i + 1 }));
  }
  const slices: MonthSlice[] = [];
  let y = selection.startYear;
  let m = selection.startMonth;
  while (y < selection.endYear || (y === selection.endYear && m <= selection.endMonth)) {
    slices.push({ year: y, month: m });
    if (slices.length === MAX_MONTH_SLICES) break;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return slices;
}

/** Returns [startUnix, endUnix] for the full span of a BudgetPeriodSelection. */
export function getBudgetSelectionBoundaries(selection: BudgetPeriodSelection): [number, number] {
  if (selection.mode === 'day') {
    const start = startOfDay(parseISO(selection.date));
    return [dateToUnix(start), dateToUnix(addDays(start, 1))];
  }
  if (selection.mode === 'month') {
    return getMonthBoundaries(selection.year, selection.month);
  }
  if (selection.mode === 'year') {
    const [start] = getMonthBoundaries(selection.year, 1);
    const [, end] = getMonthBoundaries(selection.year, 12);
    return [start, end];
  }
  const [start] = getMonthBoundaries(selection.startYear, selection.startMonth);
  const [, end] = getMonthBoundaries(selection.endYear, selection.endMonth);
  return [start, end];
}

/** Scale a global budget to the full span of a BudgetPeriodSelection. */
export function scaleGlobalBudget(budget: GlobalBudget, selection: BudgetPeriodSelection): number {
  if (!budget.amountCents) return 0;
  if (selection.mode === 'day') {
    const date = parseISO(selection.date);
    const divisor = budget.type === 'yearly' ? getDaysInYear(date) : getDaysInMonth(date);
    return Math.round(budget.amountCents / divisor);
  }
  const months = expandToMonthSlices(selection).length;
  if (budget.type === 'yearly') {
    return Math.round((budget.amountCents / 12) * months);
  }
  return budget.amountCents * months;
}

export function defaultBudgetPeriodSelection(): BudgetPeriodSelection {
  const now = new Date();
  return { mode: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function budgetPeriodLabel(selection: BudgetPeriodSelection): string {
  if (selection.mode === 'day') {
    const day = parseISO(selection.date);
    if (isToday(day)) return translate('common.today');
    if (isYesterday(day)) return translate('common.yesterday');
    if (isTomorrow(day)) return translate('common.tomorrow');
    return format(day, 'MMM d, yyyy');
  }
  if (selection.mode === 'month') {
    return format(new Date(selection.year, selection.month - 1, 1), 'MMMM yyyy');
  }
  if (selection.mode === 'year') {
    return String(selection.year);
  }
  const start = new Date(selection.startYear, selection.startMonth - 1, 1);
  const end = new Date(selection.endYear, selection.endMonth - 1, 1);
  return `${format(start, 'MMM yyyy')} – ${format(end, 'MMM yyyy')}`;
}

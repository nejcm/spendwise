import type { GlobalBudget } from './global-budget-queries';
import type { BudgetPeriodSelection, MonthSlice } from './types';
import type { DailyTrendTotal, MonthlyTotals } from '@/features/insights/types';
import type { PeriodSelection } from '@/lib/store/store';
import { currentPeriodSelection, dateToUnix, getMonthBoundaries, getPeriodRange, getYearBoundaries, monthOfDay, navigatePeriod, yearMonthOf } from '@/lib/date/helpers';

const MAX_MONTH_SLICES = 36;
const DAY = 86400;

function expandToMonthSlices(selection: BudgetPeriodSelection): MonthSlice[] {
  if (selection.mode === 'day') {
    return [monthOfDay(dateToUnix(selection.date))];
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
/** FINDINGS 20: Overview stays on InsightsEmpty below this many income/expense transactions. */
export const INSIGHTS_MIN_TRANSACTIONS = 10;

export function hasEnoughForInsights(count: number): boolean {
  return count >= INSIGHTS_MIN_TRANSACTIONS;
}

export function getBudgetSelectionBoundaries(selection: BudgetPeriodSelection): [number, number] {
  if (selection.mode === 'day') {
    const start = dateToUnix(selection.date);
    return [start, start + 86400];
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
    const { year, month } = monthOfDay(dateToUnix(selection.date));
    const [start, end] = budget.type === 'yearly' ? getYearBoundaries(year) : getMonthBoundaries(year, month);
    return Math.round(budget.amountCents * DAY / (end - start));
  }
  const months = expandToMonthSlices(selection).length;
  if (budget.type === 'yearly') {
    return Math.round((budget.amountCents / 12) * months);
  }
  return budget.amountCents * months;
}

/** Monthly amount of a global budget; a yearly one counts as a twelfth. */
export function monthlyGlobalBudget(budget: GlobalBudget | null | undefined): number | null {
  if (!budget?.amountCents) return null;
  return budget.type === 'yearly' ? Math.round(budget.amountCents / 12) : budget.amountCents;
}

/** One expense value per day in [start, end), zero-filled. */
export function dailyExpenses(start: number, end: number, rows: DailyTrendTotal[]): { date: number; value: number }[] {
  const byDate = new Map(rows.map((row) => [row.date, row.expense]));
  return Array.from({ length: Math.max(0, Math.round((end - start) / DAY)) }, (_, i) => {
    const date = start + i * DAY;
    return { date, value: byDate.get(date) ?? 0 };
  });
}

/** Per-day average and zero-spend days over the elapsed part of the range (up to and including `today`). */
export function elapsedSpendStats(start: number | undefined, end: number | undefined, rows: DailyTrendTotal[], today: number) {
  const from = start ?? rows[0]?.date ?? today;
  const until = Math.min(end ?? Infinity, today + DAY);
  const days = Math.max(0, Math.round((until - from) / DAY));
  const elapsed = rows.filter((row) => row.date >= from && row.date < until);
  const spent = elapsed.reduce((sum, row) => sum + row.expense, 0);
  const spendDays = elapsed.filter((row) => row.expense > 0).length;
  return { days, perDay: days > 0 ? Math.round(spent / days) : 0, zeroDays: Math.max(0, days - spendDays) };
}

/** Share of income left after spending, or null without income. */
export function savedRatio(income: number, expense: number): number | null {
  return income > 0 ? (income - expense) / income : null;
}

export type TrendBar = { start: number; end: number; income: number; expense: number };

/** The selected Period and the `count - 1` before it as [start, end) ranges, oldest first; All time uses calendar years. Not for Custom. */
export function trendRanges(selection: PeriodSelection, count = 6): [number, number][] {
  let current: PeriodSelection = selection.mode === 'all' ? { mode: 'year', year: currentPeriodSelection().year } : selection;
  const ranges = [getPeriodRange(current) as [number, number]];
  for (let i = 1; i < count; i++) {
    current = navigatePeriod(current, -1);
    ranges.unshift(getPeriodRange(current) as [number, number]);
  }
  return ranges;
}

const MAX_MONTH_BARS = 13;

/** A Custom Period split into days, weeks, months or years by its length, each slice clipped to the range. */
export function customRanges(start: number, end: number): { ranges: [number, number][]; labelFormat: string } {
  const days = Math.round((end - start) / DAY);
  if (days <= 31) {
    const step = days <= 7 ? DAY : 7 * DAY;
    const ranges: [number, number][] = [];
    for (let from = start; from < end; from += step) ranges.push([from, Math.min(from + step, end)]);
    return { ranges, labelFormat: days <= 7 ? 'EEE' : 'MMM d' };
  }
  const first = monthOfDay(start);
  const slices = (yearly: boolean) => {
    const ranges: [number, number][] = [];
    for (let i = 0; ; i++) {
      const [from, to] = yearly ? getYearBoundaries(first.year + i) : getMonthBoundaries(first.year, first.month + i);
      if (from >= end) return ranges;
      ranges.push([Math.max(from, start), Math.min(to, end)]);
    }
  };
  const months = slices(false);
  return months.length <= MAX_MONTH_BARS ? { ranges: months, labelFormat: 'MMM' } : { ranges: slices(true), labelFormat: 'yyyy' };
}

/** Daily rows summed into each range. */
export function trendBars(ranges: [number, number][], rows: DailyTrendTotal[]): TrendBar[] {
  return ranges.map(([start, end]) => {
    const inRange = rows.filter((row) => row.date >= start && row.date < end);
    return {
      start,
      end,
      income: inRange.reduce((sum, row) => sum + row.income, 0),
      expense: inRange.reduce((sum, row) => sum + row.expense, 0),
    };
  });
}

/** Heat level 0–3 by tertiles of the positive values; zero is always 0. */
export function heatLevels(values: number[]): number[] {
  const positive = values.filter((v) => v > 0).sort((a, b) => a - b);
  const at = (q: number) => positive[Math.min(positive.length - 1, Math.floor(positive.length * q))];
  const [low, high] = [at(1 / 3), at(2 / 3)];
  return values.map((v) => (v <= 0 ? 0 : v < low ? 1 : v < high ? 2 : 3));
}

/** Daily rows summed into `yyyy-MM` months. */
export function monthlyFromDaily(rows: DailyTrendTotal[]): MonthlyTotals[] {
  const months = new Map<string, MonthlyTotals>();
  for (const row of rows) {
    const month = yearMonthOf(row.date);
    const total = months.get(month) ?? { month, income: 0, expense: 0 };
    total.income += row.income;
    total.expense += row.expense;
    months.set(month, total);
  }
  return [...months.values()];
}

/** Fraction of [start, end) elapsed by the end of `today`, or null when today is outside it. */
export function paceFraction(start: number | undefined, end: number | undefined, today: number): number | null {
  if (start === undefined || end === undefined || today < start || today >= end) return null;
  return (today + DAY - start) / (end - start);
}

/** Days after `today` until the range ends; null when today is outside it. */
export function daysLeftIn(start: number | undefined, end: number | undefined, today: number): number | null {
  if (start === undefined || end === undefined || today < start || today >= end) return null;
  return Math.round((end - today) / DAY) - 1;
}

import type { GlobalBudget } from './global-budget-queries';
import type { BudgetPeriodSelection, MonthSlice } from './types';
import type { DailyTrendTotal, MonthlyTotals } from '@/features/insights/types';
import { getDaysInMonth, getDaysInYear, parseISO } from 'date-fns';
import { dateToUnix, getMonthBoundaries, unixToISODate } from '@/lib/date/helpers';

const MAX_MONTH_SLICES = 36;

function expandToMonthSlices(selection: BudgetPeriodSelection): MonthSlice[] {
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

const DAY = 86400;

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

const OFF_SCALE_FACTOR = 3;

/** Chart ceiling that keeps one rent-sized outlier from flattening every other bar. */
export function chartCeiling(values: number[]): number {
  const [top = 0, next = 0] = values.filter((v) => v > 0).sort((a, b) => b - a);
  return next > 0 && top > next * OFF_SCALE_FACTOR ? Math.round(next * 1.2) : Math.max(1, top);
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
    const month = unixToISODate(row.date).slice(0, 7);
    const total = months.get(month) ?? { month, income: 0, expense: 0 };
    total.income += row.income;
    total.expense += row.expense;
    months.set(month, total);
  }
  return [...months.values()];
}

/** Mean of the non-zero values, 0 when there are none. */
export function averageOfActive(values: number[]): number {
  const active = values.filter((v) => v > 0);
  return active.length ? Math.round(active.reduce((sum, v) => sum + v, 0) / active.length) : 0;
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

import type { MonthlyTotals } from '@/features/insights/types';

export type ExpenseTrendDirection = 'higher' | 'lower' | 'same' | 'unavailable';

export type MonthlyExpenseTrendModel = {
  currentExpense: number;
  direction: ExpenseTrendDirection;
  percentage: number | null;
};

export function buildMonthlyExpenseTrendModel(data: MonthlyTotals[]): MonthlyExpenseTrendModel {
  const currentExpense = data.at(-1)?.expense ?? 0;
  const previousExpense = data.at(-2)?.expense;

  if (previousExpense === undefined || previousExpense === 0) {
    return { currentExpense, direction: 'unavailable', percentage: null };
  }

  const percentage = Math.round(Math.abs((currentExpense - previousExpense) / previousExpense) * 100);
  const direction = currentExpense > previousExpense
    ? 'higher'
    : currentExpense < previousExpense
      ? 'lower'
      : 'same';

  return { currentExpense, direction, percentage };
}

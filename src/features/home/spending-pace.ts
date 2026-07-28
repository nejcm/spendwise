import type { DailyTrendTotal } from '@/features/insights/types';
import { getDaysInMonth } from 'date-fns';

export type SpendingPacePoint = {
  day: number;
  value: number;
  label?: string;
};

export type SpendingPaceModel = {
  actual: SpendingPacePoint[];
  budget: SpendingPacePoint[];
  spent: number;
  variance: number;
  status: 'below' | 'on' | 'over';
};

export function getSpendingPaceMonthRange(today: Date): [number, number] {
  const year = today.getFullYear();
  const month = today.getMonth();
  return [
    Date.UTC(year, month, 1) / 1000,
    Date.UTC(year, month + 1, 1) / 1000,
  ];
}

export function buildSpendingPaceModel(
  rows: DailyTrendTotal[],
  monthlyBudget: number,
  today: Date,
): SpendingPaceModel {
  const daysInMonth = getDaysInMonth(today);
  const currentDay = today.getDate();
  const expensesByDay = new Map<number, number>();

  for (const row of rows) {
    const rowDate = new Date(row.date * 1000);
    if (
      rowDate.getUTCFullYear() === today.getFullYear()
      && rowDate.getUTCMonth() === today.getMonth()
      && rowDate.getUTCDate() <= currentDay
    ) {
      const day = rowDate.getUTCDate();
      expensesByDay.set(day, (expensesByDay.get(day) ?? 0) + row.expense);
    }
  }

  let spent = 0;
  const actual = Array.from({ length: currentDay }, (_, index) => {
    const day = index + 1;
    spent += expensesByDay.get(day) ?? 0;
    return { day, value: spent };
  });

  const budget = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const label = day === 1 || day === currentDay || day === daysInMonth ? String(day) : undefined;
    return {
      day,
      value: Math.round((monthlyBudget * day) / daysInMonth),
      label,
    };
  });

  const paceToday = Math.round((monthlyBudget * currentDay) / daysInMonth);
  const variance = spent - paceToday;

  return {
    actual,
    budget,
    spent,
    variance,
    status: variance < 0 ? 'below' : variance > 0 ? 'over' : 'on',
  };
}

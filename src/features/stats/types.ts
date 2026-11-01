import type { PeriodSelection } from '@/lib/store/store';

export type BudgetPeriodSelection
  = | { mode: 'day'; date: string }
    | { mode: 'month'; year: number; month: number }
    | { mode: 'year'; year: number }
    | { mode: 'range'; startYear: number; startMonth: number; endYear: number; endMonth: number };

export type MonthSlice = { year: number; month: number };

export type PeriodProps = {
  selection: PeriodSelection;
  startDate: number | undefined;
  endDate: number | undefined;
};

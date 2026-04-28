export type Period = 'month' | 'year' | 'week';

export type BudgetPeriodSelection
  = | { mode: 'month'; year: number; month: number }
    | { mode: 'year'; year: number }
    | { mode: 'range'; startYear: number; startMonth: number; endYear: number; endMonth: number };

export type BudgetViewMode = 'cards' | 'chart';

export type MonthSlice = { year: number; month: number };

export type CategoryType = 'expense' | 'income';

export type CategorySpend = {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  category_budget: number | null;
  category_type: CategoryType;
  sort_order: number;
  total: number;
  income_total: number;
  expense_total: number;
  percentage: number;
};

export type MonthlyTotals = {
  month: string;
  income: number;
  expense: number;
};

export type WeeklyTotals = {
  week: number;
  label: string;
  income: number;
  expense: number;
};

export type DailyTrendTotal = {
  date: number; // Unix seconds
  income: number;
  expense: number;
};

export type TrendPoint = {
  label: string;
  income: number;
  expense: number;
};

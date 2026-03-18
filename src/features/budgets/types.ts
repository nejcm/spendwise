export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';

export type Budget = {
  id: string;
  name: string;
  period: BudgetPeriod;
  amount: number;
  start_date: number; // Unix seconds
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
};

export type BudgetLine = {
  id: string;
  budget_id: string;
  category_id: string;
  amount: number;
};

export type BudgetLineWithSpent = BudgetLine & {
  category_name: string;
  category_color: string;
  category_icon: string | null;
  spent: number;
};

export type BudgetWithProgress = Budget & {
  total_spent: number;
  lines: BudgetLineWithSpent[];
};

export type BudgetFormData = {
  name: string;
  period: BudgetPeriod;
  amount: number;
  lines: { category_id: string; amount: number }[];
};

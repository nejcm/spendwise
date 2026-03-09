export type BudgetPeriod = 'monthly' | 'weekly' | 'yearly';

export type Budget = {
  id: string;
  name: string;
  period: BudgetPeriod;
  amount: number;
  start_date: string;
  created_at: string;
  updated_at: string;
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
  amount: string;
  lines: { category_id: string; amount: string }[];
};

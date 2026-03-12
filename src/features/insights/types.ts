export type CategorySpend = {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  category_type: 'expense' | 'income';
  sort_order: number;
  total: number;
  percentage: number;
};

export type MonthlyTotals = {
  month: string;
  income: number;
  expense: number;
};

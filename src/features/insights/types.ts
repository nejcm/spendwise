export type CategorySpend = {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
  total: number;
  percentage: number;
};

export type MonthlyTotals = {
  month: string;
  income: number;
  expense: number;
};

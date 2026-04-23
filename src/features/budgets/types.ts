export interface BudgetRolloverHistory {
  id: string;
  category_id: string;
  year_month: number;
  rollover_amount: number;
}

export interface BudgetOverviewItem {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
  budget: number; // base monthly budget in cents
  effective_budget: number; // budget + rollover in cents
  rollover_amount: number; // accumulated rollover from prev month (cents)
  spent: number; // current period spend in cents
  budget_rollover: boolean;
  budget_alert_threshold: number | null;
}

export interface BudgetMonthlyHistory {
  year_month: number; // YYYYMM integer
  budget: number; // cents
  spent: number; // cents
}

export interface UnbudgetedCategory {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string | null;
}

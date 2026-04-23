export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  budget: number | null; // monthly budget in cents (base currency)
  budget_rollover: boolean;
  budget_alert_threshold: number | null; // percentage 1-99, null = use global default
  sort_order: number;
  created_at: number; // Unix seconds
}

export type CategoryFormData = {
  name: string;
  icon: string | null;
  color: string;
  budget?: string | null;
  budget_rollover?: boolean;
  budget_alert_threshold?: string | null;
  sort_order?: number | null;
};

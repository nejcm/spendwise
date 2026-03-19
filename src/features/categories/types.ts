export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  budget: number | null; // monthly budget in cents (base currency)
  sort_order: number;
  created_at: number; // Unix seconds
}

export type CategoryFormData = {
  name: string;
  icon: string | null;
  color: string;
  budget?: string | null;
  sort_order?: number | null;
};

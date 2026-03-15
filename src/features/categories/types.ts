import type { CurrencyKey } from '../currencies';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  default_currency: CurrencyKey;
  sort_order: number;
  created_at: string;
};

export type CategoryFormData = {
  name: string;
  color: string;
  sort_order?: number | null;
};

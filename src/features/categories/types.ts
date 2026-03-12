import type { CurrencyKey } from '../currencies';

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  default_currency: CurrencyKey;
  type: CategoryType;
  sort_order: number;
  created_at: string;
};

export type CategoryFormData = {
  name: string;
  type: 'expense' | 'income';
  color: string;
  sort_order?: number | null;
};

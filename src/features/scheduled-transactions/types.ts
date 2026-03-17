import type { CurrencyKey } from '@/features/currencies';

export type ScheduledTransactionType = 'income' | 'expense';
export type ScheduledTransactionFrequency
  = | 'daily'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'yearly';

export type ScheduledTransaction = {
  id: string;
  account_id: string;
  category_id: string;
  type: ScheduledTransactionType;
  amount: number;
  currency: CurrencyKey;
  note: string | null;
  frequency: ScheduledTransactionFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

export type ScheduledTransactionFormData = Pick<
  ScheduledTransaction,
  | 'account_id'
  | 'category_id'
  | 'type'
  | 'currency'
  | 'note'
  | 'frequency'
  | 'start_date'
  | 'end_date'
> & {
  amount: number | string;
  is_active: boolean;
};

export type ScheduledTransactionWithDetails = ScheduledTransaction & {
  account_icon: string | null;
  account_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  category_name: string | null;
};

export type ScheduledRunPlan = {
  dueDates: string[];
  isActive: boolean;
  nextDueDate: string;
};

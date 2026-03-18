import type { CurrencyKey } from '@/features/currencies';

// recurring rules and runs
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
  start_date: number; // Unix seconds
  end_date: number | null; // Unix seconds
  next_due_date: number; // Unix seconds
  is_active: number;
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
};

export type ScheduledTransactionRun = {
  id: string;
  rule_id: string;
  scheduled_for_date: number; // Unix seconds
  transaction_id: string;
  created_at: number; // Unix seconds
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
  dueDates: number[]; // Unix seconds
  isActive: boolean;
  nextDueDate: number; // Unix seconds
};

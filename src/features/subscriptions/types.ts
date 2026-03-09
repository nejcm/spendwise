export type RecurringFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type RecurringRule = {
  id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: number;
  note: string | null;
  payee: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  is_active: number;
  created_at: string;
};

export type RecurringRuleWithCategory = RecurringRule & {
  category_name: string | null;
  category_color: string | null;
};

export type RecurringFormData = {
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense';
  amount: string;
  note: string;
  payee: string;
  frequency: RecurringFrequency;
  start_date: string;
};

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

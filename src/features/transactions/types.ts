import type { CurrencyKey } from '../currencies';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = {
  id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number; // cents
  currency: CurrencyKey;
  date: string; // ISO 8601 date
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionFormData = Pick<Transaction, 'account_id' | 'category_id' | 'amount' | 'currency' | 'note' | 'type' | 'date'>;

export type TransactionWithCategory = Transaction & {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
};

export type MonthSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type DateGroup = {
  date: string;
  transactions: TransactionWithCategory[];
};

export type PeriodMode = 'year' | 'month' | 'week' | 'custom';

export type PeriodSelection
  = | { mode: 'year'; year: number }
    | { mode: 'month'; year: number; month: number }
    | { mode: 'week'; year: number; week: number }
    | { mode: 'custom'; startDate: string; endDate: string };

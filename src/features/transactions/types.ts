import type { CurrencyKey } from '../currencies';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = {
  id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number; // cents
  currency: CurrencyKey;
  date: string; // ISO 8601 date
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionWithCategory = Transaction & {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
};

export type TransactionFormData = {
  category_id: string | null;
  account_id: string;
  amount: string;
  type: TransactionType;
  date: string;
  note: string;
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

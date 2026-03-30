import type { CurrencyKey } from '../currencies';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = {
  id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number; // cents in transaction's own currency
  currency: CurrencyKey;
  baseAmount: number; // cents in user's preferred currency at time of creation
  baseCurrency: CurrencyKey; // the preferred currency at time of creation
  date: number; // Unix seconds
  note: string | null;
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
};

export type TransactionFormData = Pick<Transaction, 'account_id' | 'category_id' | 'amount' | 'currency' | 'note' | 'type' | 'date'> & {
  baseAmount?: number;
};

export type TransactionInsertData = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;

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
  date: number; // Unix seconds
  transactions: TransactionWithCategory[];
};

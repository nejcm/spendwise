export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = {
  id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number; // cents
  currency: string;
  date: string; // ISO 8601 date
  note: string | null;
  payee: string | null;
  transfer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionWithCategory = Transaction & {
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
};

export type TransactionFormData = {
  type: TransactionType;
  amount: string; // user input string, converted to cents on save
  category_id: string | null;
  account_id: string;
  date: string;
  note: string;
  payee: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  type: 'income' | 'expense';
  parent_id: string | null;
  is_default: number;
  sort_order: number;
  created_at: string;
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

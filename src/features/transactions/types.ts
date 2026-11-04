import type { CurrencyKey } from '../currencies';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type Transaction = {
  id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number; // cents in transaction's own currency
  currency: CurrencyKey;
  baseAmount: number; // cents in user's preferred currency at time of creation
  baseCurrency: CurrencyKey; // the preferred currency at time of creation
  date: number; // Unix seconds
  note: string | null;
  merchant_name: string | null;
  merchant_logo_slug: string | null;
  location: string | null;
  transfer_id: string | null;
  is_adjustment: number;
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
};

export type TransactionFormData = Pick<Transaction, 'account_id' | 'category_id' | 'amount' | 'currency' | 'note' | 'type' | 'date' | 'merchant_name' | 'location'> & {
  baseAmount?: number;
  to_account_id?: string | null;
  tags?: string[];
};

export type TransactionInsertData = Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'transfer_id' | 'is_adjustment'>
  & Partial<Pick<Transaction, 'transfer_id' | 'is_adjustment'>>
  & {
    /** Omitted leaves stored tags untouched; `[]` clears them. */
    tags?: string[];
  };

/** `account_id` is the source; `amount` is positive cents in `currency`. */
export type TransferInsertData = Omit<TransactionInsertData, 'type' | 'transfer_id' | 'is_adjustment'> & {
  to_account_id: string;
};

export type TransactionWithCategory = Transaction & {
  account_name: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  counter_account_id: string | null;
  counter_account_name: string | null;
  counter_account_icon: string | null;
  counter_amount: number | null;
  counter_currency: CurrencyKey | null;
  tags: string[];
};

export type MonthSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type TransactionSort = 'newest' | 'oldest' | 'largest' | 'smallest';

export type FilterState = {
  type: TransactionType | null;
  accountIds: string[];
  categoryIds: string[];
  /** Any-of, compared by `tagKey`. */
  tags: string[];
  /** Cents in Preferred Currency, compared against `baseAmount`. */
  minAmount: number | null;
  maxAmount: number | null;
  sort: TransactionSort;
};

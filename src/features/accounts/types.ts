import type { CurrencyKey } from '../currencies';

export type AccountType = 'cash' | 'checking' | 'savings' | 'credit_card' | 'investment' | 'other';

export type Account = {
  id: string;
  name: string;
  description: string | null;
  type: AccountType;
  currency: CurrencyKey;
  budget?: number | null; // credit limit or budget cap
  icon: string | null;
  color: string | null;
  is_archived: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AccountWithBalance = Account & {
  balance: number; // computed: income - expense
};

export type AccountFormData = {
  name: string;
  type: AccountType;
  currency: string;
  description: string | null;
  budget?: string | null;
  icon: string | null;
  color: string | null;
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Cash',
  checking: 'Checking',
  savings: 'Savings',
  credit_card: 'Credit Card',
  investment: 'Investment',
  other: 'Other',
};

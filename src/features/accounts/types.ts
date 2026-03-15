import type { CurrencyKey } from '../currencies';
import { translate } from '../../lib/i18n';

export const ACCOUNT_TYPES = ['cash', 'checking', 'savings', 'credit_card', 'investment', 'other'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

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
  cash: translate('accounts.typeOptions.cash'),
  checking: translate('accounts.typeOptions.checking'),
  savings: translate('accounts.typeOptions.savings'),
  credit_card: translate('accounts.typeOptions.credit_card'),
  investment: translate('accounts.typeOptions.investment'),
  other: translate('accounts.typeOptions.other'),
};

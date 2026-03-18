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
  created_at: number; // Unix seconds
  updated_at: number; // Unix seconds
};

export type AccountWithBalance = Account & {
  balance: number; // computed: income - expense
};

export type AccountFormData = {
  name: string;
  type: AccountType;
  currency: CurrencyKey;
  description: string | null;
  budget?: string | null;
  icon: string | null;
  color: string | null;
};

const baseNs = 'accounts.typeOptions';
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: translate(`${baseNs}.cash`),
  checking: translate(`${baseNs}.checking`),
  savings: translate(`${baseNs}.savings`),
  credit_card: translate(`${baseNs}.credit_card`),
  investment: translate(`${baseNs}.investment`),
  other: translate(`${baseNs}.other`),
};

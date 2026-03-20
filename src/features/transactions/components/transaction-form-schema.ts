import type { TransactionType } from '../types';
import type { CurrencyKey } from '@/features/currencies';

import * as z from 'zod';
import { DEFAULT_USER_CURRENCY } from '@/config';
import { CURRENCY_VALUES } from '@/features/currencies';
import { formatMajorUnitsInputFromCents, todayISO } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { refinePositiveNumber, refinePositiveNumberOrNull } from '@/lib/validation/helpers';

export const transactionFormSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer'] as TransactionType[]),
  currency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
  amount: z.string().min(1, translate('transactions.amount_required')).refine(refinePositiveNumber, translate('transactions.amount_required')),
  baseAmount: z.string().nullable().refine(refinePositiveNumberOrNull, translate('transactions.base_amount_required')),
  baseCurrency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
  category_id: z.string().min(1, translate('transactions.category_required')),
  account_id: z.string().min(1, translate('transactions.account_required')),
  date: z.string().min(1, translate('transactions.date_required')),
  note: z.string().nullable(),
});

export const TRANSACTION_TYPE_OPTIONS: { label: string; value: 'expense' | 'income' }[] = [
  { label: translate('common.expense'), value: 'expense' },
  { label: translate('common.income'), value: 'income' },
];

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export type TransactionFormInitialValues = Partial<Omit<TransactionFormValues, 'amount' | 'baseAmount'>> & {
  amount?: number | string;
  /** Cents in preferred currency when loading from `Transaction`. */
  baseAmount?: number;
  id?: string;
};

export const transactionFormDefaultValues = {
  type: 'expense',
  category_id: '',
  account_id: '',
  date: todayISO(),
  amount: '',
  currency: DEFAULT_USER_CURRENCY,
  baseAmount: '',
  baseCurrency: useAppStore.getState().currency,
  note: null,
} satisfies TransactionFormValues;

export function amountToString(amount?: number | string): string {
  if (amount == null) return '';
  if (typeof amount === 'number') {
    return formatMajorUnitsInputFromCents(amount);
  }
  return String(amount);
}

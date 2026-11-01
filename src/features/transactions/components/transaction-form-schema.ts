import type { TransactionType, TransactionWithCategory } from '../types';
import type { CurrencyKey } from '@/features/currencies';

import * as z from 'zod';
import { DEFAULT_USER_CURRENCY } from '@/config';
import { CURRENCY_VALUES } from '@/features/currencies';
import { formatMajorUnitsInputFromCents, todayISO } from '@/features/formatting/helpers';
import { isValidISODate, unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import { refinePositiveNumber, refinePositiveNumberOrNull } from '@/lib/validation/helpers';

const amountError = translate('transactions.form.amount_error');

const transactionFormFields = z.object({
  type: z.enum(['expense', 'income', 'transfer'] as TransactionType[]),
  currency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
  amount: z.string().min(1, amountError).refine(refinePositiveNumber, amountError),
  baseAmount: z.string().nullable().refine(refinePositiveNumberOrNull, translate('transactions.base_amount_required')),
  category_id: z.string(),
  account_id: z.string().min(1, translate('transactions.account_required')),
  // null: a legacy transfer leg without a pair, edited as a single row
  to_account_id: z.string().nullable(),
  date: z.string().min(1, translate('transactions.date_required')).refine(isValidISODate, translate('transactions.date_invalid')),
  note: z.string().max(500, translate('transactions.form.too_long', { max: 500 })).nullable(),
  merchant_name: z.string().max(100, translate('transactions.form.too_long', { max: 100 })).nullable(),
  location: z.string().max(250, translate('transactions.form.too_long', { max: 250 })).nullable(),
});

export const transactionFormSchema = transactionFormFields.superRefine((value, ctx) => {
  if (value.type !== 'transfer') {
    if (!value.category_id) ctx.addIssue({ code: 'custom', path: ['category_id'], message: translate('transactions.form.category_error') });
    return;
  }
  if (value.to_account_id !== null && (!value.to_account_id || value.to_account_id === value.account_id)) {
    ctx.addIssue({ code: 'custom', path: ['to_account_id'], message: translate('transactions.to_account_required') });
  }
});

/** Opening balance: signed, e.g. a credit card starts in debt. */
export const adjustmentFormSchema = transactionFormFields.extend({
  amount: z.string().min(1, amountError).refine((v) => !!toNumber(v), amountError),
});

export const TRANSACTION_TYPE_OPTIONS: { label: string; value: TransactionType }[] = [
  { label: translate('common.expense'), value: 'expense' },
  { label: translate('common.income'), value: 'income' },
  { label: translate('transactions.form.transfer_type'), value: 'transfer' },
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
  to_account_id: '',
  date: todayISO(),
  amount: '',
  currency: DEFAULT_USER_CURRENCY,
  baseAmount: '',
  note: null,
  merchant_name: null,
  location: null,
} satisfies TransactionFormValues;

/** "Save & add another": clears what differs per entry, keeps type, accounts, date, currency and category. */
export function nextEntryValues(values: TransactionFormValues): TransactionFormValues {
  return { ...values, amount: '', baseAmount: '', merchant_name: null, note: null, location: null };
}

export function amountToString(amount?: number | string): string {
  if (amount == null) return '';
  if (typeof amount === 'number') {
    return formatMajorUnitsInputFromCents(amount);
  }
  return String(amount);
}

/** Edit values for a stored row; a paired transfer leg always opens as its out leg. */
export function transactionToFormValues(t: TransactionWithCategory): TransactionFormInitialValues {
  const values: TransactionFormInitialValues = {
    id: t.id,
    type: t.type,
    category_id: t.category_id ?? '',
    account_id: t.account_id,
    to_account_id: t.type === 'transfer' ? null : '',
    amount: t.is_adjustment ? t.amount : Math.abs(t.amount),
    currency: t.currency,
    baseAmount: t.baseAmount,
    date: unixToISODate(t.date),
    note: t.note,
    merchant_name: t.merchant_name,
    location: t.location,
  };
  if (!t.transfer_id || !t.counter_account_id) return values;
  const isOut = t.amount < 0;
  return {
    ...values,
    account_id: isOut ? t.account_id : t.counter_account_id,
    to_account_id: isOut ? t.counter_account_id : t.account_id,
    amount: Math.abs(isOut ? t.amount : t.counter_amount ?? t.amount),
    currency: isOut ? t.currency : t.counter_currency ?? t.currency,
  };
}

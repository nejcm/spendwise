import type { TransactionFormInitialValues } from './components/transaction-form-schema';
import type { TransactionType } from './types';
import type { CurrencyKey } from '@/features/currencies';
import type { ScheduledTransactionInitialValues } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import * as z from 'zod';
import { CURRENCY_VALUES } from '@/features/currencies';
import { parseToCents } from '@/lib/data';

type ParamValue = string | string[] | undefined;

type TransactionFormRouteParams = {
  account_id?: ParamValue;
  amount?: ParamValue;
  category_id?: ParamValue;
  currency?: ParamValue;
  date?: ParamValue;
  location?: ParamValue;
  merchant_name?: ParamValue;
  note?: ParamValue;
  to_account_id?: ParamValue;
  type?: ParamValue;
};

type ScheduledFormRouteParams = {
  account_id?: ParamValue;
  amount?: ParamValue;
  category_id?: ParamValue;
  currency?: ParamValue;
  end_date?: ParamValue;
  frequency?: ParamValue;
  is_active?: ParamValue;
  note?: ParamValue;
  start_date?: ParamValue;
  source_transaction_id?: ParamValue;
  type?: ParamValue;
};

const currencySchema = z.enum(CURRENCY_VALUES as [CurrencyKey, ...CurrencyKey[]]);
const singleParamSchema = z.preprocess(
  (value) => typeof value === 'string' ? value : undefined,
  z.string().optional(),
);
const nullableStringParamSchema = singleParamSchema.transform((value) => {
  if (value === undefined) return undefined;
  return value.trim() || null;
});
const AMOUNT_PATTERN = /^([^\d.,()\-\u2212]{0,4})([\d.,]+)([^\d.,()\-\u2212]{0,4})$/;
const INTEGER_PATTERN = /^(?:\d+|\d{1,3}(?:[.,]\d{3})+)$/;

// Accepts locale-formatted currency text as iOS Shortcuts inserts it, e.g. `€1.234,56` or `12,50 EUR`.
function parseAmountText(raw: string): { amount?: string; currency?: CurrencyKey } {
  const match = AMOUNT_PATTERN.exec(raw.replace(/\s/g, ''));
  if (!match) return {};
  const [, prefix, number, suffix] = match;
  const lastSeparator = Math.max(number.lastIndexOf('.'), number.lastIndexOf(','));
  const fraction = number.slice(lastSeparator + 1);
  const isDecimal = lastSeparator >= 0 && fraction.length > 0 && fraction.length <= 2;
  const groupedInteger = isDecimal ? number.slice(0, lastSeparator) : number;
  if (groupedInteger && !INTEGER_PATTERN.test(groupedInteger)) return {};
  const integer = groupedInteger.replace(/[.,]/g, '');
  const amount = isDecimal ? `${integer || '0'}.${fraction}` : integer;
  const cents = parseToCents(amount);
  const currency = currencySchema.safeParse(`${prefix}${suffix}`.toUpperCase()).data;
  return cents !== null && cents > 0 ? { amount, currency } : {};
}

const amountParamSchema = singleParamSchema.transform((value) => value === undefined ? undefined : parseAmountText(value).amount);
const booleanParamSchema = singleParamSchema.transform((value) => {
  if (value === undefined) return undefined;
  return value === 'true' || value === '1';
});
const transactionFormRouteParamsSchema = z.object({
  account_id: singleParamSchema,
  amount: amountParamSchema,
  category_id: singleParamSchema,
  currency: singleParamSchema.pipe(currencySchema.optional()).catch(undefined),
  date: singleParamSchema,
  location: nullableStringParamSchema,
  merchant_name: nullableStringParamSchema,
  note: nullableStringParamSchema,
  to_account_id: singleParamSchema,
  type: singleParamSchema.pipe(z.enum(['expense', 'income', 'transfer'] satisfies TransactionType[]).optional()).catch(undefined),
});
const scheduledFormRouteParamsSchema = z.object({
  account_id: singleParamSchema,
  amount: amountParamSchema,
  category_id: singleParamSchema,
  currency: singleParamSchema.pipe(currencySchema.optional()).catch(undefined),
  end_date: singleParamSchema.transform((value) => {
    if (value === undefined) return undefined;
    return value || null;
  }),
  frequency: singleParamSchema.pipe(z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'yearly']).optional()).catch(undefined),
  is_active: booleanParamSchema,
  note: nullableStringParamSchema,
  start_date: singleParamSchema,
  source_transaction_id: singleParamSchema,
  type: singleParamSchema.pipe(z.enum(['expense', 'income']).optional()).catch(undefined),
});

function compactObject<T extends object>(value: T): Partial<T> | undefined {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) as Partial<T> : undefined;
}

export function parseTransactionFormInitialValues(params: TransactionFormRouteParams): TransactionFormInitialValues | undefined {
  const parsed = transactionFormRouteParamsSchema.parse(params);
  const amountCurrency = typeof params.amount === 'string' ? parseAmountText(params.amount).currency : undefined;
  return compactObject<TransactionFormInitialValues>({ ...parsed, currency: parsed.currency ?? amountCurrency });
}

export function parseScheduledFormInitialValues(params: ScheduledFormRouteParams): ScheduledTransactionInitialValues | undefined {
  const parsed = scheduledFormRouteParamsSchema.parse(params);
  return compactObject<ScheduledTransactionInitialValues>(parsed);
}

import type { TransactionFormInitialValues } from './components/transaction-form-schema';
import type { TransactionType } from './types';
import type { CurrencyKey } from '@/features/currencies';
import type { ScheduledTransactionInitialValues } from '@/features/scheduled-transactions/components/scheduled-transaction-form';
import * as z from 'zod';
import { CURRENCY_VALUES } from '@/features/currencies';

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
const amountParamSchema = singleParamSchema.transform((value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? value : undefined;
});
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
  type: singleParamSchema.pipe(z.enum(['expense', 'income', 'transfer'] satisfies TransactionType[]).optional()).catch(undefined),
});
const scheduledFormRouteParamsSchema = z.object({
  account_id: singleParamSchema,
  amount: singleParamSchema,
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
  type: singleParamSchema.pipe(z.enum(['expense', 'income']).optional()).catch(undefined),
});

function compactObject<T extends object>(value: T): Partial<T> | undefined {
  const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) as Partial<T> : undefined;
}

export function parseTransactionFormInitialValues(params: TransactionFormRouteParams): TransactionFormInitialValues | undefined {
  const parsed = transactionFormRouteParamsSchema.parse(params);
  return compactObject<TransactionFormInitialValues>(parsed);
}

export function parseScheduledFormInitialValues(params: ScheduledFormRouteParams): ScheduledTransactionInitialValues | undefined {
  const parsed = scheduledFormRouteParamsSchema.parse(params);
  return compactObject<ScheduledTransactionInitialValues>(parsed);
}

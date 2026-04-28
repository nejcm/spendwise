import type { FilterState, TransactionType } from './types';
import type { PeriodSelection } from '@/lib/store/store';

type ParamValue = string | string[] | undefined;

export type TransactionRouteParams = {
  accountId?: ParamValue;
  categoryId?: ParamValue;
  search?: ParamValue;
  type?: ParamValue;
};

export type TransactionsRouteSeed = {
  filters: FilterState;
  periodSelection?: PeriodSelection;
  search: string;
};

const TRANSACTION_TYPES = new Set<TransactionType>(['expense', 'income', 'transfer']);

function firstValue(value: ParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseType(value: ParamValue): TransactionType | null {
  const normalized = firstValue(value);
  return normalized && TRANSACTION_TYPES.has(normalized as TransactionType)
    ? normalized as TransactionType
    : null;
}

export function parseTransactionsRouteSeed(params: TransactionRouteParams): TransactionsRouteSeed {
  return {
    search: firstValue(params.search)?.trim() ?? '',
    filters: {
      accountId: firstValue(params.accountId) ?? null,
      categoryId: firstValue(params.categoryId) ?? null,
      type: parseType(params.type),
    },
  };
}

import type { FilterState, TransactionSort, TransactionType } from './types';
import type { PeriodSelection } from '@/lib/store/store';
import { isValidISODate } from '@/lib/date/helpers';
import { DEFAULT_FILTERS, SORT_OPTIONS } from './filters';

type ParamValue = string | string[] | undefined;

/** `accountId` and `categoryId` take one id or a comma-separated list; amounts are cents. */
export type TransactionRouteParams = {
  accountId?: ParamValue;
  categoryId?: ParamValue;
  maxAmount?: ParamValue;
  minAmount?: ParamValue;
  period?: ParamValue;
  search?: ParamValue;
  sort?: ParamValue;
  type?: ParamValue;
};

export type TransactionsRouteSeed = {
  filters: FilterState;
  periodSelection?: PeriodSelection;
  search: string;
};

export type TransactionsHrefSeed = Partial<FilterState> & {
  periodSelection?: PeriodSelection;
  search?: string;
};

const TRANSACTION_TYPES = new Set<TransactionType>(['expense', 'income', 'transfer']);
const RELATIVE_PERIODS = new Set<string>(['all', 'today', 'this-week', 'this-month', 'this-year']);

function firstValue(value: ParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIds(value: ParamValue): string[] {
  const values = Array.isArray(value) ? value : [value ?? ''];
  return [...new Set(values.flatMap((v) => v.split(',')).map((id) => id.trim()).filter(Boolean))];
}

function parseCents(value: ParamValue): number | null {
  const raw = firstValue(value);
  return raw && /^\d+$/.test(raw) ? Number(raw) : null;
}

function parseSort(value: ParamValue): TransactionSort {
  const raw = firstValue(value);
  return SORT_OPTIONS.find((sort) => sort === raw) ?? DEFAULT_FILTERS.sort;
}

function parseType(value: ParamValue): TransactionType | null {
  const normalized = firstValue(value);
  return normalized && TRANSACTION_TYPES.has(normalized as TransactionType)
    ? normalized as TransactionType
    : null;
}

function parseIntInRange(value: string | undefined, min: number, max: number): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return parsed >= min && parsed <= max ? parsed : undefined;
}

export function parsePeriodParam(value: ParamValue): PeriodSelection | undefined {
  const raw = firstValue(value)?.trim();
  if (!raw) return undefined;
  if (RELATIVE_PERIODS.has(raw)) return { mode: raw } as PeriodSelection;

  const [mode, rest] = raw.split(':', 2);
  switch (mode) {
    case 'year': {
      const year = parseIntInRange(rest, 1900, 9999);
      return year ? { mode: 'year', year } : undefined;
    }
    case 'month': {
      const [y, m] = rest?.split('-') ?? [];
      const year = parseIntInRange(y, 1900, 9999);
      const month = m?.length === 2 ? parseIntInRange(m, 1, 12) : undefined;
      return year && month ? { mode: 'month', year, month } : undefined;
    }
    case 'week': {
      const [y, w] = rest?.split('-W') ?? [];
      const year = parseIntInRange(y, 1900, 9999);
      const week = parseIntInRange(w, 1, 53);
      return year && week ? { mode: 'week', year, week } : undefined;
    }
    case 'day':
      return rest && isValidISODate(rest) ? { mode: 'day', date: rest } : undefined;
    case 'custom': {
      const [startDate, endDate] = rest?.split('..') ?? [];
      return startDate && endDate && isValidISODate(startDate) && isValidISODate(endDate) && startDate <= endDate
        ? { mode: 'custom', startDate, endDate }
        : undefined;
    }
    default:
      return undefined;
  }
}

export function formatPeriodParam(selection: PeriodSelection): string {
  switch (selection.mode) {
    case 'year':
      return `year:${selection.year}`;
    case 'month':
      return `month:${selection.year}-${String(selection.month).padStart(2, '0')}`;
    case 'week':
      return `week:${selection.year}-W${selection.week}`;
    case 'day':
      return `day:${selection.date}`;
    case 'custom':
      return `custom:${selection.startDate}..${selection.endDate}`;
    default:
      return selection.mode;
  }
}

export function parseTransactionsRouteSeed(params: TransactionRouteParams): TransactionsRouteSeed {
  const periodSelection = parsePeriodParam(params.period);
  return {
    search: firstValue(params.search)?.trim() ?? '',
    filters: {
      type: parseType(params.type),
      accountIds: parseIds(params.accountId),
      categoryIds: parseIds(params.categoryId),
      minAmount: parseCents(params.minAmount),
      maxAmount: parseCents(params.maxAmount),
      sort: parseSort(params.sort),
    },
    ...(periodSelection && { periodSelection }),
  };
}

export function buildTransactionsHref({ accountIds, categoryIds, minAmount, maxAmount, sort, search, type, periodSelection }: TransactionsHrefSeed) {
  const params: Record<string, string> = {};
  if (accountIds?.length) params.accountId = accountIds.join(',');
  if (categoryIds?.length) params.categoryId = categoryIds.join(',');
  if (minAmount != null) params.minAmount = String(minAmount);
  if (maxAmount != null) params.maxAmount = String(maxAmount);
  if (sort && sort !== DEFAULT_FILTERS.sort) params.sort = sort;
  if (search?.trim()) params.search = search.trim();
  if (type) params.type = type;
  if (periodSelection) params.period = formatPeriodParam(periodSelection);
  return { pathname: '/transactions' as const, params };
}

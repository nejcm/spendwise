import type { FilterState, TransactionSort, TransactionWithCategory } from './types';
import { dateToUnix, unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { tagKey } from './helpers';
import { isTransferInLeg } from './queries';

type Row = TransactionWithCategory;

export const DEFAULT_FILTERS: FilterState = {
  type: null,
  accountIds: [],
  categoryIds: [],
  tags: [],
  minAmount: null,
  maxAmount: null,
  sort: 'newest',
};

export const SORT_OPTIONS: readonly TransactionSort[] = ['newest', 'oldest', 'largest', 'smallest'];

function matchesSearch(t: Row, q: string, tagQuery: string): boolean {
  return !!(t.note?.toLowerCase().includes(q)
    || t.category_name?.toLowerCase().includes(q)
    || t.merchant_name?.toLowerCase().includes(q)
    || t.counter_account_name?.toLowerCase().includes(q)
    || t.tags.some((tag) => tagKey(tag).includes(tagQuery))
    || t.amount?.toString().includes(q));
}

function matchesType(t: Row, type: FilterState['type']): boolean {
  if (!type) return true;
  return t.type === type && !(type === 'transfer' && t.is_adjustment);
}

/** Without an account filter a transfer pair shows once, as its out leg. */
export function filterTransactions(transactions: readonly Row[], filters: FilterState, search = ''): Row[] {
  const q = search.trim().toLowerCase();
  const tagQuery = tagKey(search.trim());
  const accounts = new Set(filters.accountIds);
  const categories = new Set(filters.categoryIds);
  const tags = new Set(filters.tags.map(tagKey));
  const rows = transactions.filter((t) => {
    if (!matchesType(t, filters.type)) return false;
    if (accounts.size ? !accounts.has(t.account_id) : isTransferInLeg(t)) return false;
    if (categories.size && !(t.category_id && categories.has(t.category_id))) return false;
    if (tags.size && !t.tags.some((tag) => tags.has(tagKey(tag)))) return false;
    const size = Math.abs(t.baseAmount);
    if (filters.minAmount !== null && size < filters.minAmount) return false;
    if (filters.maxAmount !== null && size > filters.maxAmount) return false;
    return !q || matchesSearch(t, q, tagQuery);
  });
  return sortTransactions(rows, filters.sort);
}

const newest = (a: Row, b: Row) => b.date - a.date || b.created_at - a.created_at || b.id.localeCompare(a.id);
const COMPARATORS: Record<TransactionSort, (a: Row, b: Row) => number> = {
  newest,
  oldest: (a, b) => newest(b, a),
  largest: (a, b) => Math.abs(b.baseAmount) - Math.abs(a.baseAmount) || newest(a, b),
  smallest: (a, b) => Math.abs(a.baseAmount) - Math.abs(b.baseAmount) || newest(a, b),
};

export function sortTransactions(rows: readonly Row[], sort: TransactionSort): Row[] {
  return [...rows].sort(COMPARATORS[sort]);
}

export const isDateSort = (sort: TransactionSort) => sort === 'newest' || sort === 'oldest';

/** In / Out / Net in Preferred Currency; transfers, including opening-balance adjustments, are neither. */
export function summarizeTransactions(rows: readonly Row[]) {
  let income = 0;
  let expense = 0;
  for (const t of rows) {
    if (t.type === 'income') income += t.baseAmount;
    else if (t.type === 'expense') expense += t.baseAmount;
  }
  return { count: rows.length, income, expense, net: income - expense };
}

export type DayGroup = {
  day: number;
  /** Net of income and expense; null when the day has only transfers. */
  total: number | null;
  transactions: Row[];
};

/** Groups runs of same-day rows, so the input must already be date-sorted. */
export function groupByDay(rows: readonly Row[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const t of rows) {
    const day = dateToUnix(unixToISODate(t.date));
    let group = groups.at(-1);
    if (group?.day !== day) {
      group = { day, total: null, transactions: [] };
      groups.push(group);
    }
    group.transactions.push(t);
    if (t.type !== 'transfer') group.total = (group.total ?? 0) + (t.type === 'income' ? t.baseAmount : -t.baseAmount);
  }
  return groups;
}

export function countActiveFilters(filters: FilterState): number {
  const hasAmount = filters.minAmount !== null || filters.maxAmount !== null;
  return filters.accountIds.length + filters.categoryIds.length + filters.tags.length + (hasAmount ? 1 : 0);
}

type Named = { id: string; name: string; icon?: string | null };

export type ActiveFilterChip = {
  key: string;
  label: string;
  icon?: string | null;
  remove: Partial<FilterState>;
};

export function getActiveFilterChips(
  filters: FilterState,
  { accounts, categories }: { accounts: readonly Named[]; categories: readonly Named[] },
  formatAmount: (cents: number) => string,
): ActiveFilterChip[] {
  const chipsFor = (ids: string[], items: readonly Named[], field: 'accountIds' | 'categoryIds') =>
    ids.flatMap((id) => {
      const item = items.find((i) => i.id === id);
      return item ? [{ key: `${field}:${id}`, label: item.name, icon: item.icon, remove: { [field]: ids.filter((x) => x !== id) } }] : [];
    });

  const chips: ActiveFilterChip[] = [
    ...chipsFor(filters.categoryIds, categories, 'categoryIds'),
    ...chipsFor(filters.accountIds, accounts, 'accountIds'),
    ...filters.tags.map((tag) => ({ key: `tags:${tagKey(tag)}`, label: tag, remove: { tags: filters.tags.filter((x) => tagKey(x) !== tagKey(tag)) } })),
  ];
  const { minAmount: min, maxAmount: max } = filters;
  if (min !== null || max !== null) {
    const label = min !== null && max !== null
      ? translate('transactions.filter.amount_between', { min: formatAmount(min), max: formatAmount(max) })
      : min !== null
        ? translate('transactions.filter.amount_from', { amount: formatAmount(min) })
        : translate('transactions.filter.amount_to', { amount: formatAmount(max!) });
    chips.push({ key: 'amount', label, icon: undefined, remove: { minAmount: null, maxAmount: null } });
  }
  return chips;
}

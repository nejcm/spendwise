import type { Category } from './types';
import type { CategorySpend, CategoryType, MonthlyTotals } from '@/features/insights/types';
import type { TransactionType } from '@/features/transactions/types';
import type { TxKeyPath } from '@/lib/i18n';
import type { PeriodSelection } from '@/lib/store/store';
import { DEFAULT_CATEGORY_ID } from '@/config';
import { formatDateFull } from '@/features/formatting/helpers';
import { getMonthBoundaries, yearMonthOf } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { COLORS } from '@/lib/theme/colors';

export function fitsTransactionType(category: Pick<Category, 'id' | 'kind'>, type: TransactionType): boolean {
  return type === 'transfer' || category.id === DEFAULT_CATEGORY_ID || category.kind === type;
}

export function firstFittingCategoryId(
  ids: (string | null | undefined)[],
  categories: Pick<Category, 'id' | 'kind'>[],
  type: TransactionType,
): string | undefined {
  return ids.find((id) => {
    const category = categories.find((c) => c.id === id);
    return category && fitsTransactionType(category, type);
  }) ?? undefined;
}

/** Starting values whose category contradicts the type: a given type drops the category, otherwise the type follows the category. */
export function fitCategoryToType<T extends { type: TransactionType; category_id: string | null }>(
  values: T,
  categories: Pick<Category, 'id' | 'kind'>[],
  given: { type: boolean; category: boolean },
): T {
  const category = categories.find((c) => c.id === values.category_id);
  if (!category) return values;
  // A category the caller picked rules out a remembered transfer type.
  const fits = fitsTransactionType(category, values.type) && !(given.category && values.type === 'transfer');
  if (fits) return values;
  return given.type ? { ...values, category_id: '' } : { ...values, type: category.kind };
}

export function isUncategorised(id: string): boolean {
  return id === DEFAULT_CATEGORY_ID;
}

export const amountFor = (kind: CategoryType, item: CategorySpend) => kind === 'income' ? item.income_total : item.expense_total;

/** Activity of that kind in the Period, or the category's own kind; Uncategorised only with activity. */
export function inKindTab(kind: CategoryType, item: CategorySpend): boolean {
  return amountFor(kind, item) > 0 || (!isUncategorised(item.category_id) && item.category_type === kind);
}

/** The `kind` route param when valid, else the category's stored kind. */
export function routeKind(param: string | undefined, stored: CategoryType | undefined): CategoryType {
  return param === 'income' || param === 'expense' ? param : stored ?? 'expense';
}

export function categoryName(id: string, name: string): string {
  return isUncategorised(id) ? translate('categories.uncategorised') : name;
}

export function categoryIcon(id: string, icon: string | null | undefined, name: string): string {
  if (isUncategorised(id)) return '◌';
  return icon?.trim() || name.charAt(0).toUpperCase();
}

const words = (name: string) => new Set(name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));

/** Same-kind categories ordered by shared name words, then by closest spending. */
export function rankMoveTargets<T extends Pick<Category, 'id' | 'name' | 'kind' | 'sort_order'>>(
  deleted: T,
  categories: T[],
  spendById: Record<string, number>,
): T[] {
  const deletedWords = words(deleted.name);
  const deletedSpend = spendById[deleted.id] ?? 0;
  const shared = (c: T) => [...words(c.name)].filter((w) => deletedWords.has(w)).length;
  const distance = (c: T) => Math.abs((spendById[c.id] ?? 0) - deletedSpend);
  return categories
    .filter((c) => c.id !== deleted.id && !isUncategorised(c.id) && c.kind === deleted.kind)
    .sort((a, b) => shared(b) - shared(a) || distance(a) - distance(b) || a.sort_order - b.sort_order);
}

export type MonthBar = { month: string; start: number; value: number };

/** `count` months ending with `endYearMonth` (yyyy-MM), zero-filled. */
export function buildMonthBars(rows: MonthlyTotals[], endYearMonth: string, kind: Category['kind'], count = 6): MonthBar[] {
  const [year, month] = endYearMonth.split('-').map(Number);
  const byMonth = new Map(rows.map((row) => [row.month, row[kind]]));
  return Array.from({ length: count }, (_, i) => {
    const [start] = getMonthBoundaries(year, month - count + 1 + i);
    const key = yearMonthOf(start);
    return { month: key, start, value: byMonth.get(key) ?? 0 };
  });
}

export function monthBarsRange(endYearMonth: string, count = 6): [number, number] {
  const [year, month] = endYearMonth.split('-').map(Number);
  return [getMonthBoundaries(year, month - count + 1)[0], getMonthBoundaries(year, month)[1]];
}

export function averageOfLast(bars: MonthBar[], count = 3): number {
  const last = bars.slice(-count);
  return last.length ? Math.round(last.reduce((sum, bar) => sum + bar.value, 0) / last.length) : 0;
}

export const COLOR_HUES = ['gray', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'sky', 'blue', 'purple', 'pink'] as const;
const COLOR_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/** Hue and shade of a palette colour, e.g. `#fb923c` → orange 400. */
export function paletteColorName(hex: string | null | undefined): { hue: typeof COLOR_HUES[number]; step: number } | null {
  const index = hex ? COLORS.indexOf(hex.toLowerCase()) : -1;
  if (index < 0) return null;
  return { hue: COLOR_HUES[Math.floor(index / 10)], step: COLOR_STEPS[index % 10] };
}

/** Month name for month Periods ("October"), null for any other Period. */
export function periodMonthName(selection: PeriodSelection, startDate: number | undefined): string | null {
  return (selection.mode === 'month' || selection.mode === 'this-month') && startDate !== undefined
    ? formatDateFull(startDate, 'MMMM')
    : null;
}

/** Localized palette name, e.g. "Orange 400"; the hex for colours outside the palette. */
export function colorLabel(hex: string) {
  const named = paletteColorName(hex);
  return named ? `${translate(`categories.colors.${named.hue}`)} ${named.step}` : hex;
}

/** Picks the `_one` or `_many` variant of a key by count. */
export function translateCount(key: string, count: number, options?: Record<string, unknown>) {
  return translate(`${key}_${count === 1 ? 'one' : 'many'}` as TxKeyPath, { count, ...options } as never);
}

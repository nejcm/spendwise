import type { CurrencyKey } from '../currencies';
import type { NumberFormat } from './constants';
import { format, isToday, isYesterday } from 'date-fns';
import { translate } from '@/lib/i18n';
import { DEFAULT_DATE_FORMAT } from '../../config';

/**
 * Convert cents integer to display string.
 * e.g., 1234 -> "12.34", -500 -> "-5.00"
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

/**
 * Convert display amount to cents integer.
 * e.g., 12.34 -> 1234, 5 -> 500
 */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Format cents as a signed currency string for display.
 * Income shows +, expenses show -.
 */
type SignedCurrencyOptions = {
  cents: number;
  type: 'income' | 'expense' | 'transfer';
  currency?: string;
  locale?: string;
};

export function formatSignedCurrency(options: SignedCurrencyOptions): string {
  const { cents, type, currency = 'EUR', locale = 'en-US' } = options;
  const amount = centsToAmount(cents);
  const sign = type === 'income' ? '+' : '-';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
  return `${sign}${formatted}`;
}

const NUMBER_FORMAT_MAP: Record<NumberFormat, [string, Intl.NumberFormatOptions]> = {
  'stop': ['de-DE', { useGrouping: false }],
  'stop-space': ['de-DE', { useGrouping: true }],
  'comma': ['en-US', { useGrouping: false }],
  'comma-space': ['en-US', { useGrouping: true }],
} as const;
export function formatNumber(value: number | string, numberFormat: NumberFormat): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);

  const [locale, opts] = NUMBER_FORMAT_MAP[numberFormat];
  return new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 2,
    ...opts,
  }).format(number);
}

/**
 * Format cents as a currency string.
 * e.g., 1234, 'EUR' -> "€12.34"
 *
 * This currently relies on Intl and does not use user currency/number
 * formatting preferences. Those preferences are applied by higher-level
 * components when rendering textual values.
 */
export function formatCurrency(value: number | string, currency: CurrencyKey, numberFormat: NumberFormat = 'comma'): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);

  const [locale, opts] = NUMBER_FORMAT_MAP[numberFormat];
  return new Intl.NumberFormat(locale, {
    useGrouping: true,
    maximumFractionDigits: 20,
    style: 'currency',
    currency,
    unitDisplay: 'narrow',
    ...opts,
  }).format(centsToAmount(number));
}

/**
 * Format a Unix seconds timestamp for display.
 * Shows "Today", "Yesterday", or the formatted date using the
 * user's preferred date format from the store, unless an
 * explicit format override is provided.
 */
export function formatDate(unix: number, displayFormat?: string): string {
  const date = new Date(unix * 1000);
  if (isToday(date)) return translate('common.today');
  if (isYesterday(date)) return translate('common.yesterday');
  return format(date, displayFormat || DEFAULT_DATE_FORMAT);
}

/**
 * Format a Unix seconds timestamp as a short date.
 * e.g., "Mar 9"
 */
export function formatShortDate(unix: number): string {
  return format(new Date(unix * 1000), 'MMM d');
}

/**
 * Format a Unix seconds timestamp as month and year.
 * e.g., "March 2026"
 */
export function formatMonthYear(unix: number): string {
  return format(new Date(unix * 1000), 'MMMM yyyy');
}

/**
 * Get today's date as an ISO string (date only). Used internally by scheduler.
 */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get today as Unix seconds (local midnight).
 */
export function todayUnix(): number {
  return Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
}

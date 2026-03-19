import type { CurrencyKey } from '../currencies';
import type { CurrencyFormat, NumberFormat } from './constants';
import { format, isToday, isYesterday } from 'date-fns';
import { translate } from '@/lib/i18n';
import { DEFAULT_DATE_FORMAT } from '../../config';
import { CURRENCIES_MAP } from '../currencies';

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

const NUMBER_FORMAT_MAP: Record<NumberFormat, [string, Intl.NumberFormatOptions]> = {
  'stop': ['en-US', { useGrouping: false }],
  'stop-space': ['en-US', { useGrouping: true }],
  'comma': ['de-DE', { useGrouping: false }],
  'comma-space': ['de-DE', { useGrouping: true }],
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
 * Format cents as a currency string using the given number and currency format.
 * e.g., 123456, 'EUR', 'comma-space', 'symbol-before' -> "€\u00a01.234,56"
 */
export function formatCurrency(value: number | string, currency: CurrencyKey, numberFormat: NumberFormat = 'comma', currencyFormat: CurrencyFormat = 'symbol-before'): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);

  const isNegative = number < 0;
  const isCurrencyBeforeNumber = currencyFormat === 'symbol-before' || currencyFormat === 'code-before';
  const numberForFormatting = isNegative && isCurrencyBeforeNumber ? Math.abs(number) : number;
  const formattedNumber = formatNumber(centsToAmount(numberForFormatting), numberFormat);
  const isCode = currencyFormat === 'code-before' || currencyFormat === 'code-after';
  const currencyTxt = isCode ? currency : CURRENCIES_MAP[currency].symbol;
  const space = isCode ? ' ' : '';

  if (isCurrencyBeforeNumber) {
    return isNegative ? `-${currencyTxt}${space}${formattedNumber}` : `${currencyTxt}${space}${formattedNumber}`;
  }
  return `${formattedNumber}${space}${currencyTxt}`;
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

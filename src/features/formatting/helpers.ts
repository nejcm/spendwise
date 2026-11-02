import type { CurrencyKey } from '../currencies';
import type { CurrencyFormat, NumberFormat } from './constants';
import { format as formatDateFns, isToday, isYesterday } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import i18n from 'i18next';
import { calendarDateToUnix, unixToCalendarDate, unixToDate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { DEFAULT_DATE_FORMAT, DEFAULT_USER_CURRENCY } from '../../config';
import { shortenNumberString } from '../../lib/number';
import { CURRENCIES_MAP } from '../currencies';

const WHOLE_CENTS = /\.00$/;

/**
 * Convert cents integer to display string.
 * e.g., 1234 -> "12.34", -500 -> "-5.00"
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

/** String for amount inputs when loading cents from the database (e.g. transaction edit). */
export function formatMajorUnitsInputFromCents(cents: number): string {
  const n = centsToAmount(cents);
  if (!Number.isFinite(n)) return '';
  const s = n.toFixed(2);
  return s.replace(WHOLE_CENTS, '');
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
export function formatNumber(value: number | string, numberFormat: NumberFormat, fractionDigits = 2, minFractionDigits = 0): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);

  const [locale, opts] = NUMBER_FORMAT_MAP[numberFormat];
  return new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits: Math.min(minFractionDigits, fractionDigits),
    maximumFractionDigits: fractionDigits,
    ...opts,
  }).format(number);
}

/**
 * Format cents as a currency string using the given number and currency format.
 * e.g., 123456, 'EUR', 'comma-space', 'symbol-before' -> "€\u00a01.234,56"
 */
export function formatCurrency(
  value: number | string,
  currency: CurrencyKey,
  options: {
    numberFormat: NumberFormat;
    currencyFormat: CurrencyFormat;
    /** `true` shortens from 1000 up; a number shortens from that many major units up. */
    shorten?: boolean | number;
    negativeSymbol?: boolean;
    fractionDigits?: number;
  } = {
    numberFormat: 'comma',
    currencyFormat: 'symbol-before',
    fractionDigits: 2,
  },
): string {
  const { numberFormat, currencyFormat, negativeSymbol = true, shorten = false, fractionDigits = 2 } = options;
  const shortenAbove = shorten === true ? 1000 : shorten || Infinity;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return String(value);
  const curr = currency?.length ? currency : DEFAULT_USER_CURRENCY;

  const adjustedNumber = negativeSymbol ? number : Math.abs(number);
  const isNegative = adjustedNumber < 0;
  const isCurrencyBeforeNumber = currencyFormat === 'symbol-before' || currencyFormat === 'code-before';
  const numberForFormatting = isNegative && isCurrencyBeforeNumber ? Math.abs(adjustedNumber) : adjustedNumber;
  const amount = centsToAmount(numberForFormatting);
  const formattedNumber = Math.abs(amount) >= shortenAbove
    ? shortenNumberString(amount, shortenAbove, fractionDigits)
    : formatNumber(amount, numberFormat, fractionDigits, Number.isInteger(amount) ? 0 : 2);
  const isCode = currencyFormat === 'code-before' || currencyFormat === 'code-after';
  const currencyTxt = isCode ? curr : CURRENCIES_MAP[curr]?.symbol ?? DEFAULT_USER_CURRENCY;
  const space = isCode ? ' ' : '';

  if (isCurrencyBeforeNumber) {
    return isNegative ? `-${currencyTxt}${space}${formattedNumber}` : `${currencyTxt}${space}${formattedNumber}`;
  }
  return `${formattedNumber}${space}${currencyTxt}`;
}

const FRACTION_PATTERNS = { stop: /\.\d+(?!.*\d)/, comma: /,\d+(?!.*\d)/ } as const;

/** Splits a formatted amount around its fraction, e.g. "€7,400.75" → ["€7,400", ".75", ""]. */
export function splitFraction(formatted: string, numberFormat: NumberFormat): [string, string, string] {
  const match = FRACTION_PATTERNS[numberFormat.startsWith('comma') ? 'comma' : 'stop'].exec(formatted);
  if (!match) return [formatted, '', ''];
  const end = match.index + match[0].length;
  return [formatted.slice(0, match.index), match[0], formatted.slice(end)];
}

function format(date: Date, displayFormat: string): string {
  return formatDateFns(date, displayFormat, { locale: i18n.resolvedLanguage === 'de' ? de : enUS });
}

function formatRelativeOrDate(date: Date, displayFormat?: string): string {
  if (isToday(date)) return translate('common.today');
  if (isYesterday(date)) return translate('common.yesterday');
  return format(date, displayFormat || DEFAULT_DATE_FORMAT);
}

/**
 * Format a calendar-date Unix timestamp (UTC midnight) for display.
 * Shows "Today", "Yesterday", or the formatted date using the
 * user's preferred date format from the store, unless an
 * explicit format override is provided.
 *
 * Use {@link formatInstant} for real timestamps (e.g. created_at).
 */
export function formatDate(unix: number, displayFormat?: string): string {
  return formatRelativeOrDate(unixToCalendarDate(unix), displayFormat);
}
export function formatDateFull(unix: number, displayFormat?: string): string {
  return format(unixToCalendarDate(unix), displayFormat || DEFAULT_DATE_FORMAT);
}

/**
 * Format an instant (a real Unix seconds timestamp, e.g. created_at) in the
 * device's local time zone. Unlike {@link formatDate}, the value is not
 * treated as a UTC-midnight calendar date.
 */
export function formatInstant(unix: number, displayFormat?: string): string {
  return formatRelativeOrDate(unixToDate(unix), displayFormat);
}
export function formatInstantFull(unix: number, displayFormat?: string): string {
  return format(unixToDate(unix), displayFormat || DEFAULT_DATE_FORMAT);
}

/**
 * Format a Unix seconds timestamp as a short date.
 * e.g., "Mar 9"
 */
export function formatShortDate(unix: number): string {
  return format(unixToCalendarDate(unix), 'MMM d');
}

/**
 * Get today's date as an ISO string (date only). Used internally by scheduler.
 */
export function todayISO(): string {
  return formatDateFns(new Date(), 'yyyy-MM-dd');
}

/**
 * Get today as a UTC-midnight date-only Unix timestamp.
 */
export function todayUnix(): number {
  return calendarDateToUnix(new Date());
}

import { format, isToday, isYesterday, parseISO } from 'date-fns';

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
 * Format cents as a currency string.
 * e.g., 1234, 'EUR' -> "€12.34"
 */
export function formatCurrency(cents: number, currency: string = 'EUR', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(centsToAmount(cents));
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

/**
 * Format an ISO date string for display.
 * Shows "Today", "Yesterday", or the formatted date.
 */
export function formatDate(isoDate: string, dateFormat: string = 'MMM d, yyyy'): string {
  const date = parseISO(isoDate);
  if (isToday(date))
    return 'Today';
  if (isYesterday(date))
    return 'Yesterday';
  return format(date, dateFormat);
}

/**
 * Format an ISO date string as a short date.
 * e.g., "Mar 9"
 */
export function formatShortDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MMM d');
}

/**
 * Format an ISO date string as month and year.
 * e.g., "March 2026"
 */
export function formatMonthYear(isoDate: string): string {
  return format(parseISO(isoDate), 'MMMM yyyy');
}

/**
 * Get today's date as an ISO string (date only).
 */
export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Unified money module.
 *
 * Single import path for all money-related operations:
 * - Cents conversion (amountToCents, centsToAmount)
 * - Currency formatting (formatCurrency, formatNumber)
 * - Multi-currency conversion (convertAmount)
 * - String-to-cents parsing (parseToCents)
 */

export { convertAmount } from '@/features/currencies/api';

/**
 * Parse a user-entered string value into cents.
 * Returns null for empty, null, undefined, or non-numeric input.
 *
 * Replaces the local `budgetToCents` in accounts/api.ts.
 */
export function parseToCents(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

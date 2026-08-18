/**
 * Shared money helpers.
 *
 * - Multi-currency conversion (convertAmount, re-exported from the currencies feature)
 * - String-to-cents parsing (parseToCents)
 *
 * Cents conversion (amountToCents, centsToAmount) and currency/number
 * formatting live in `src/features/formatting/helpers.ts`.
 */

export { convertAmount } from '@/features/currencies/api';

/**
 * Parse a user-entered string value into cents.
 * Returns null for empty, null, undefined, or non-numeric input.
 */
export function parseToCents(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

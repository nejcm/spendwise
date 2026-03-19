import type { CurrencyKey } from './';
import type { RatesMap } from './queries';

/**
 * Converts `amountCents` from `txCurrency` to `preferredCurrency` using
 * EUR-based rates (EUR → everything). EUR itself is always rate 1.
 *
 * This is the single source of truth for baseAmount computation:
 *   amount (txCurrency) → EUR → preferredCurrency
 */
export function computeBaseAmount(
  amountCents: number,
  txCurrency: CurrencyKey,
  preferredCurrency: CurrencyKey,
  rates: RatesMap,
): number {
  if (txCurrency === preferredCurrency) return amountCents;
  const fromRate = txCurrency === 'EUR' ? 1 : (rates[txCurrency] ?? 1);
  const toRate = preferredCurrency === 'EUR' ? 1 : (rates[preferredCurrency] ?? 1);
  return Math.round((amountCents / fromRate) * toRate);
}

import type { CurrencyKey } from '.';
import type { RatesMap } from './queries';
import type { CurrencyFormat, NumberFormat } from '@/features/formatting/constants';
import { formatCurrency } from '@/features/formatting/helpers';
import { CURRENCIES_MAP } from '.';

const RECENT_LIMIT = 5;

/** Preferred Currency first, then the persisted last-used list (form saves), deduplicated. */
export function recentCurrencies(preferred: CurrencyKey, lastUsed: readonly CurrencyKey[] = []): CurrencyKey[] {
  return [...new Set([preferred, ...lastUsed])].filter((c) => c in CURRENCIES_MAP).slice(0, RECENT_LIMIT);
}

/** "€1 = $1.18": one unit of Preferred Currency in `currency` (two significant digits for small rates); null when a rate is missing. */
export function currencyRateText(
  currency: CurrencyKey,
  preferred: CurrencyKey,
  rates: RatesMap | undefined,
  format: { numberFormat: NumberFormat; currencyFormat: CurrencyFormat },
): string | null {
  const eurRate = (c: CurrencyKey) => (c === 'EUR' ? 1 : rates?.[c]);
  const to = eurRate(currency);
  const from = eurRate(preferred);
  if (!to || !from) return null;
  const rate = to / from;
  const one = formatCurrency(100, preferred, { ...format, fractionDigits: 0 });
  return `${one} = ${formatCurrency(rate * 100, currency, { ...format, fractionDigits: Math.max(2, Math.ceil(-Math.log10(rate)) + 1) })}`;
}

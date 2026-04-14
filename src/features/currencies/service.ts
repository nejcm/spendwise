import type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap } from './providers/types';
import { captureError } from '@/lib/analytics';

import { splitBy } from '@/lib/date/helpers';
import { fawazahmed0Provider } from './providers/fawazahmed0';
import { frankfurterProvider } from './providers/frankfurter';
import { openErApiProvider } from './providers/open-er-api';

export type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap };

/**
 * Other services
 * - https://openexchangerates.org/
 * - https://freecurrencyapi.com/
 * - https://www.exchangerate-api.com/
 */

const defaultProviderOrder: readonly CurrencyRatesProvider[] = [
  frankfurterProvider,
  fawazahmed0Provider,
  openErApiProvider,
] as const;

export async function fetchRates() {
  let result: FetchRatesResult | null | undefined;
  for (const p of defaultProviderOrder) {
    result = await p.latest();
    if (result) break;
  }

  if (!result) {
    const err = new Error('All currency rate providers failed');
    console.error(err.message);
    captureError(err);
    throw err;
  }

  return result;
}

export async function fetchRatesForDate(dateStr: string) {
  let result: FetchRatesResult | null | undefined;
  for (const p of defaultProviderOrder) {
    result = await p.historical(dateStr);
    if (result) break;
  }

  if (!result) {
    const err = new Error(`Historical currency rate providers failed for date ${dateStr}`);
    console.error(err.message);
    captureError(err, { date: dateStr });
    throw err;
  }

  return result;
}

// Historical (date range)
export async function fetchRatesForDateRange(
  startDate: string,
  endDate: string,
) {
  const segments = splitBy(startDate, endDate, 3);
  if (segments.length === 0) {
    // fallback to single segment
    segments.push({ start: startDate, end: endDate });
  }

  const results = await Promise.allSettled(
    segments.map(async (seg) => {
      for (const p of defaultProviderOrder) {
        const value = await p.range(seg.start, seg.end);
        if (value) return value;
      }
      return null;
    }),
  );

  const merged: Record<string, RateMap> = {};
  for (const result of results) {
    if (result.status === 'rejected' || !result.value) {
      const err = new Error(`Date-range currency rate providers failed for ${startDate}..${endDate}`);
      console.error(err.message);
      captureError(err, { startDate, endDate: endDate ?? startDate });
      continue;
    }
    if (result.status === 'fulfilled' && result.value) {
      Object.assign(merged, result.value.ratesByDate);
    }
  }

  if (Object.keys(merged).length === 0) {
    throw new Error(`Date-range currency rate providers failed for ${startDate}..${endDate}`);
  }

  return { ratesByDate: merged, source: 'currency-range' };
}

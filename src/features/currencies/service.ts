import type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap } from './providers/types';
import { captureError } from '@/lib/analytics';

import { splitBy } from '@/lib/date/helpers';
import { fawazahmed0Provider } from './providers/fawazahmed0';
import { frankfurterProvider } from './providers/frankfurter';
import { openErApiProvider } from './providers/open-er-api';
import {
  HISTORICAL_DATE_WALKBACK_DAYS,
  HISTORICAL_WALKBACK_BUDGET_MS,
  priorCalendarDates,
} from './providers/utils';

export type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap };

export type FetchRatesOptions = {
  reportToAnalytics?: boolean;
  /** Overall wall-clock budget (ms) across walkback dates + providers. Defaults to {@link HISTORICAL_WALKBACK_BUDGET_MS}. */
  budgetMs?: number;
};

/**
 * Other services
 * - https://openexchangerates.org/
 * - https://freecurrencyapi.com/
 * - https://www.exchangerate-api.com/
 */

const latestProviders: readonly CurrencyRatesProvider[] = [
  frankfurterProvider,
  fawazahmed0Provider,
  openErApiProvider,
] as const;

const historicalProviders: readonly CurrencyRatesProvider[] = [
  frankfurterProvider,
  fawazahmed0Provider,
] as const;

const rangeProviders: readonly CurrencyRatesProvider[] = [
  frankfurterProvider,
  fawazahmed0Provider,
] as const;

async function tryProviders<T>(
  providers: readonly CurrencyRatesProvider[],
  fn: (provider: CurrencyRatesProvider) => Promise<T | null>,
): Promise<{ result: T | null; failedProviders: string[] }> {
  const failedProviders: string[] = [];
  for (const provider of providers) {
    const result = await fn(provider);
    if (result) return { result, failedProviders };
    failedProviders.push(provider.id);
  }
  return { result: null, failedProviders };
}

async function tryHistoricalWithWalkback(
  provider: CurrencyRatesProvider,
  dateStr: string,
  deadlineMs: number,
): Promise<FetchRatesResult | null> {
  for (const tryDate of priorCalendarDates(dateStr, HISTORICAL_DATE_WALKBACK_DAYS)) {
    const result = await provider.historical(tryDate);
    if (result) return result;
    // Always attempt the anchor date; bail before walking further once the
    // shared budget is spent so a degraded network can't stall reads for minutes.
    if (Date.now() >= deadlineMs) break;
  }
  return null;
}

export async function fetchRates() {
  const { result, failedProviders } = await tryProviders(latestProviders, (p) => p.latest());

  if (!result) {
    const err = new Error('All currency rate providers failed');
    console.error(err.message);
    captureError(err, { failedProviders });
    throw err;
  }

  return result;
}

export async function fetchRatesForDate(dateStr: string, options?: FetchRatesOptions) {
  const deadlineMs = Date.now() + (options?.budgetMs ?? HISTORICAL_WALKBACK_BUDGET_MS);
  const { result, failedProviders } = await tryProviders(
    historicalProviders,
    (p) => tryHistoricalWithWalkback(p, dateStr, deadlineMs),
  );

  if (!result) {
    const err = new Error(`Historical currency rate providers failed for date ${dateStr}`);
    console.error(err.message);
    if (options?.reportToAnalytics !== false) {
      captureError(err, { date: dateStr, failedProviders });
    }
    throw err;
  }

  return result;
}

export async function fetchRatesForDateRange(
  startDate: string,
  endDate: string,
) {
  const segments = splitBy(startDate, endDate, 3);
  if (segments.length === 0) {
    segments.push({ start: startDate, end: endDate });
  }

  const results = await Promise.allSettled(
    segments.map(async (seg) => {
      const { result } = await tryProviders(rangeProviders, (p) => p.range(seg.start, seg.end));
      return result;
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

import type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap } from './types';
import { UTCDate } from '@date-fns/utc';
import { eachDayOfInterval } from 'date-fns';

import {
  fetchRatesWithBackoff,
  filterSupportedRates,
  RANGE_HISTORICAL_MAX_FETCHES,
  subsampleOrderedToMaxCount,
} from './utils';

function isoDatesInRange(startDate: string, endDate: string): string[] {
  const start = new UTCDate(`${startDate}T00:00:00Z`);
  const end = new UTCDate(`${endDate}T00:00:00Z`);
  return eachDayOfInterval({ start, end }).map((d) => d.toISOString().slice(0, 10));
}

async function fetchLatestImpl(): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json',
      ),
    (data) => {
      const d = data as { eur?: Record<string, number> };
      if (!d.eur) return null;
      const rates = filterSupportedRates(d.eur);
      rates.EUR = 1;
      return { rates, source: 'fawazahmed0' };
    },
  );
}

async function fetchHistoricalImpl(dateStr: string): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/eur.json`,
      ),
    (data) => {
      const d = data as { eur?: Record<string, number> };
      if (!d.eur) return null;
      const rates = filterSupportedRates(d.eur);
      rates.EUR = 1;
      return { rates, source: 'fawazahmed0-historical' };
    },
  );
}

async function fetchRangeImpl(
  startDate: string,
  endDate: string,
): Promise<DateRangeRatesResult | null> {
  const dateStrs = subsampleOrderedToMaxCount(
    isoDatesInRange(startDate, endDate),
    RANGE_HISTORICAL_MAX_FETCHES,
  );
  const ratesByDate: Record<string, RateMap> = {};
  await Promise.all(
    dateStrs.map(async (dateStr) => {
      const result = await fetchHistoricalImpl(dateStr);
      if (result) ratesByDate[dateStr] = result.rates;
    }),
  );
  if (Object.keys(ratesByDate).length === 0) return null;
  return { ratesByDate, source: 'fawazahmed0-range-fallback' };
}

export const fawazahmed0Provider: CurrencyRatesProvider = {
  id: 'fawazahmed0',
  latest: fetchLatestImpl,
  historical: fetchHistoricalImpl,
  range: fetchRangeImpl,
};

import type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap } from './types';

import { CURRENCY_VALUES } from '../index';
import { fetchRatesWithBackoff, filterSupportedRates } from './utils';

const FRANKFURTER_SYMBOLS = CURRENCY_VALUES.filter((c) => c !== 'EUR').join(',');

async function fetchLatestImpl(): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(
        `https://api.frankfurter.app/latest?from=EUR&to=${FRANKFURTER_SYMBOLS}`,
      ),
    (data) => {
      const d = data as { rates?: Record<string, number> };
      if (!d.rates) return null;
      const rates = filterSupportedRates(d.rates);
      rates.EUR = 1;
      return { rates, source: 'frankfurter' };
    },
  );
}

async function fetchHistoricalImpl(dateStr: string): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(
        `https://api.frankfurter.app/${dateStr}?from=EUR&to=${FRANKFURTER_SYMBOLS}`,
      ),
    (data) => {
      const d = data as { rates?: Record<string, number> };
      if (!d.rates) return null;
      const rates = filterSupportedRates(d.rates);
      rates.EUR = 1;
      return { rates, source: 'frankfurter-historical' };
    },
  );
}

function parseRangeSegment(data: { rates?: Record<string, Record<string, number>> } | undefined): Record<string, RateMap> | null {
  if (!data?.rates) return null;
  const ratesByDate: Record<string, RateMap> = {};
  for (const [dateStr, dayRates] of Object.entries(data.rates)) {
    const filtered = filterSupportedRates(dayRates);
    filtered.EUR = 1;
    ratesByDate[dateStr] = filtered;
  }
  return ratesByDate;
}

async function fetchRangeImpl(
  startDate: string,
  endDate: string,
): Promise<DateRangeRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(
        `https://api.frankfurter.app/${startDate}..${endDate}?from=EUR&to=${FRANKFURTER_SYMBOLS}`,
      ),
    (data) => {
      const ratesByDate = parseRangeSegment(
        data as { rates?: Record<string, Record<string, number>> },
      );
      return ratesByDate ? { ratesByDate, source: 'frankfurter-range' } : null;
    },
  );
}

export const frankfurterProvider: CurrencyRatesProvider = {
  id: 'frankfurter',
  latest: fetchLatestImpl,
  historical: fetchHistoricalImpl,
  range: fetchRangeImpl,
};

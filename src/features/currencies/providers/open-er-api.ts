import type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult } from './types';
import { fetchRatesWithBackoff, filterSupportedRates } from './utils';

async function fetchLatestImpl(): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () => fetch('https://open.er-api.com/v6/latest/EUR'),
    (data) => {
      const d = data as { result?: string; rates?: Record<string, number> };
      if (d.result !== 'success' || !d.rates) return null;
      const rates = filterSupportedRates(d.rates);
      rates.EUR = 1;
      return { rates, source: 'open-er-api' };
    },
  );
}

async function fetchHistoricalImpl(_dateStr: string): Promise<FetchRatesResult | null> {
  // not supported
  return null;
}

async function fetchRangeImpl(_startDate: string, _endDate: string): Promise<DateRangeRatesResult | null> {
  // not supported
  return null;
}

export const openErApiProvider: CurrencyRatesProvider = {
  id: 'open-er-api',
  latest: fetchLatestImpl,
  historical: fetchHistoricalImpl,
  range: fetchRangeImpl,
};

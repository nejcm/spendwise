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

async function fetchHistoricalImpl(dateStr: string): Promise<FetchRatesResult | null> {
  throw new Error('open-er-api does not support historical rates');
}

async function fetchRangeImpl(startDate: string, endDate: string): Promise<DateRangeRatesResult | null> {
  throw new Error('open-er-api does not support date-range rates');
}

export const openErApiProvider: CurrencyRatesProvider = {
  id: 'open-er-api',
  latest: fetchLatestImpl,
  historical: fetchHistoricalImpl,
  range: fetchRangeImpl,
};

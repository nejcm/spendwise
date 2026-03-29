import type { FetchRatesResult } from './types';
import { fetchRatesWithBackoff, filterSupportedRates } from './utils';

// https://open.er-api.com/v6/latest/EUR — free tier, no auth needed
// Does not support historical or date-range queries.

export async function fetchFromOpenErApi(): Promise<FetchRatesResult | null> {
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

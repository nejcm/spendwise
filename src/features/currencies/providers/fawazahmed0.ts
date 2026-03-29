import type { DateRangeRatesResult, FetchRatesResult, RateMap } from './types';
import { fetchRatesWithBackoff, filterSupportedRates } from './utils';

// https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api — CDN-hosted, no auth, no rate limits

export async function fetchFromFawazahmed0(): Promise<FetchRatesResult | null> {
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

export async function fetchHistoricalFromFawazahmed0(dateStr: string): Promise<FetchRatesResult | null> {
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

export async function fetchRangeFallbackDayByDay(
  dateStrs: string[],
): Promise<DateRangeRatesResult | null> {
  const ratesByDate: Record<string, RateMap> = {};
  await Promise.all(
    dateStrs.map(async (dateStr) => {
      const result = await fetchHistoricalFromFawazahmed0(dateStr);
      if (result) ratesByDate[dateStr] = result.rates;
    }),
  );
  if (Object.keys(ratesByDate).length === 0) return null;
  return { ratesByDate, source: 'fawazahmed0-range-fallback' };
}

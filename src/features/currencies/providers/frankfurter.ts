import type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap } from './types';

import { CURRENCY_VALUES } from '../index';
import { fetchRatesWithBackoff, filterSupportedRates } from './utils';

const FRANKFURTER_SYMBOLS = CURRENCY_VALUES.filter((c) => c !== 'EUR').join(',');
const FRANKFURTER_RATES_URL = 'https://api.frankfurter.dev/v2/rates';

type FrankfurterRateRow = {
  date?: string;
  quote?: string;
  rate?: number;
};

function buildRatesUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `${FRANKFURTER_RATES_URL}?${searchParams.toString()}`;
}

function parseRates(data: unknown): RateMap | null {
  if (!Array.isArray(data)) return null;

  const rawRates: Record<string, number> = {};
  for (const row of data) {
    const { quote, rate } = row as FrankfurterRateRow;
    if (typeof quote === 'string' && typeof rate === 'number') {
      rawRates[quote] = rate;
    }
  }

  const rates = filterSupportedRates(rawRates);
  if (Object.keys(rates).length === 0) return null;
  rates.EUR = 1;
  return rates;
}

async function fetchLatestImpl(): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(buildRatesUrl({ base: 'EUR', quotes: FRANKFURTER_SYMBOLS })),
    (data) => {
      const rates = parseRates(data);
      if (!rates) return null;
      return { rates, source: 'frankfurter' };
    },
  );
}

async function fetchHistoricalImpl(dateStr: string): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(buildRatesUrl({ base: 'EUR', quotes: FRANKFURTER_SYMBOLS, date: dateStr })),
    (data) => {
      const rates = parseRates(data);
      if (!rates) return null;
      return { rates, source: 'frankfurter-historical' };
    },
  );
}

function parseRangeSegment(data: unknown): Record<string, RateMap> | null {
  if (!Array.isArray(data)) return null;

  const rawRatesByDate: Record<string, Record<string, number>> = {};
  for (const row of data) {
    const { date, quote, rate } = row as FrankfurterRateRow;
    if (typeof date !== 'string' || typeof quote !== 'string' || typeof rate !== 'number') {
      continue;
    }

    const dayRates = rawRatesByDate[date] ?? {};
    dayRates[quote] = rate;
    rawRatesByDate[date] = dayRates;
  }

  const ratesByDate: Record<string, RateMap> = {};
  for (const [date, rawRates] of Object.entries(rawRatesByDate)) {
    const filtered = filterSupportedRates(rawRates);
    filtered.EUR = 1;
    ratesByDate[date] = filtered;
  }

  return Object.keys(ratesByDate).length > 0 ? ratesByDate : null;
}

async function fetchRangeImpl(
  startDate: string,
  endDate: string,
): Promise<DateRangeRatesResult | null> {
  return fetchRatesWithBackoff(
    () =>
      fetch(buildRatesUrl({ base: 'EUR', quotes: FRANKFURTER_SYMBOLS, from: startDate, to: endDate })),
    (data) => {
      const ratesByDate = parseRangeSegment(data);
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

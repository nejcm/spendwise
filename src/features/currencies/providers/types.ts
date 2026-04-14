import type { CurrencyKey } from '..';

export type RateMap = Partial<Record<CurrencyKey, number>>;

export type FetchRatesResult = {
  rates: RateMap;
  source: string;
};

export type DateRangeRatesResult = {
  /** Keyed by ISO date string `"YYYY-MM-DD"`. */
  ratesByDate: Record<string, RateMap>;
  source: string;
};

export type CurrencyRatesProvider = {
  id: string;
  latest: () => Promise<FetchRatesResult | null>;
  historical: (dateStr: string) => Promise<FetchRatesResult | null>;
  range: (startDate: string, endDate: string) => Promise<DateRangeRatesResult | null>;
};

export type RateMap = Partial<Record<string, number>>;

export type FetchRatesResult = {
  rates: RateMap;
  source: string;
};

export type DateRangeRatesResult = {
  /** Keyed by ISO date string `"YYYY-MM-DD"`. */
  ratesByDate: Record<string, RateMap>;
  source: string;
};

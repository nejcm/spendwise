import { CURRENCY_VALUES } from './index';

export type RateMap = Partial<Record<string, number>>;

export type FetchRatesResult = {
  rates: RateMap;
  source: string;
};

function filterSupportedRates(raw: Record<string, unknown>): RateMap {
  const result: RateMap = {};
  for (const key of CURRENCY_VALUES) {
    const val = raw[key.toLowerCase()] ?? raw[key];
    if (typeof val === 'number') {
      result[key] = val;
    }
  }
  return result;
}

// ─── API 1: Frankfurter (ECB data) ───────────────────────────────────────────
// https://api.frankfurter.app/latest — returns EUR-based rates, no auth needed

async function fetchFromFrankfurter(): Promise<FetchRatesResult | null> {
  try {
    const symbols = CURRENCY_VALUES.filter((c) => c !== 'EUR').join(',');
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=EUR&to=${symbols}`,
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { rates?: Record<string, number> };
    if (!data.rates) return null;

    // Frankfurter uses uppercase keys matching our CurrencyKey format
    const rates = filterSupportedRates(data.rates);
    rates.EUR = 1;
    return { rates, source: 'frankfurter' };
  }
  catch {
    return null;
  }
}

// ─── API 2: fawazahmed0 exchange-api (CDN-hosted, no auth, no rate limits) ───
// https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json

async function fetchFromFawazahmed0(): Promise<FetchRatesResult | null> {
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json',
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { eur?: Record<string, number> };
    if (!data.eur) return null;

    // Keys are lowercase (e.g. "usd", "gbp") — filterSupportedRates handles this
    const rates = filterSupportedRates(data.eur);
    rates.EUR = 1;
    return { rates, source: 'fawazahmed0' };
  }
  catch {
    return null;
  }
}

// ─── API 3: Open ExchangeRate-API (free tier, no auth needed) ────────────────
// https://open.er-api.com/v6/latest/EUR

async function fetchFromOpenErApi(): Promise<FetchRatesResult | null> {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/EUR');
    if (!response.ok) return null;

    const data = (await response.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (data.result !== 'success' || !data.rates) return null;

    const rates = filterSupportedRates(data.rates);
    rates.EUR = 1;
    return { rates, source: 'open-er-api' };
  }
  catch {
    return null;
  }
}

// ─── Exported: tries APIs in order, throws only if ALL fail ──────────────────

export async function fetchRates(): Promise<FetchRatesResult | undefined> {
  const result
    = (await fetchFromFrankfurter())
      ?? (await fetchFromFawazahmed0())
      ?? (await fetchFromOpenErApi());

  if (!result) {
    console.error('All currency rate providers failed');
    return undefined;
  }

  return result;
}

// ─── Historical rate fetching ─────────────────────────────────────────────────
// Frankfurter and Fawazahmed0 both support historical dates; Open ER-API free
// tier does not, so we only try the first two providers.

async function fetchHistoricalFromFrankfurter(dateStr: string): Promise<FetchRatesResult | null> {
  try {
    const symbols = CURRENCY_VALUES.filter((c) => c !== 'EUR').join(',');
    const response = await fetch(
      `https://api.frankfurter.app/${dateStr}?from=EUR&to=${symbols}`,
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { rates?: Record<string, number> };
    if (!data.rates) return null;

    const rates = filterSupportedRates(data.rates);
    rates.EUR = 1;
    return { rates, source: 'frankfurter-historical' };
  }
  catch {
    return null;
  }
}

async function fetchHistoricalFromFawazahmed0(dateStr: string): Promise<FetchRatesResult | null> {
  try {
    const response = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateStr}/v1/currencies/eur.json`,
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { eur?: Record<string, number> };
    if (!data.eur) return null;

    const rates = filterSupportedRates(data.eur);
    rates.EUR = 1;
    return { rates, source: 'fawazahmed0-historical' };
  }
  catch {
    return null;
  }
}

/**
 * Fetches EUR-based exchange rates for a specific historical date.
 * `dateStr` must be in `YYYY-MM-DD` format.
 * Returns `undefined` if all providers fail.
 */
export async function fetchRatesForDate(dateStr: string): Promise<FetchRatesResult | undefined> {
  const result
    = (await fetchHistoricalFromFrankfurter(dateStr))
      ?? (await fetchHistoricalFromFawazahmed0(dateStr));

  if (!result) {
    console.error(`Historical currency rate providers failed for date ${dateStr}`);
    return undefined;
  }

  return result;
}

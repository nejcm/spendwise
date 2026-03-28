import { captureError } from '@/lib/analytics';
import { CURRENCY_VALUES } from './index';

export type RateMap = Partial<Record<string, number>>;

export type FetchRatesResult = {
  rates: RateMap;
  source: string;
};

/** Attempts per provider before giving up (handles rate limits / transient errors). */
const RATE_FETCH_MAX_ATTEMPTS = 4;
const RATE_FETCH_INITIAL_BACKOFF_MS = 400;

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rateFetchBackoffDelayMs(attemptIndex: number): number {
  const exponential = RATE_FETCH_INITIAL_BACKOFF_MS * 2 ** attemptIndex;
  const jitter = Math.floor(Math.random() * 200);
  return exponential + jitter;
}

function isRetryableHttpStatus(status: number): boolean {
  return (
    status === 408
    || status === 429
    || status === 502
    || status === 503
    || status === 504
  );
}

/**
 * Fetches JSON from `doRequest`, with exponential backoff retries when the
 * server signals rate limits / overload or the request fails transiently.
 */
async function fetchRatesWithBackoff(
  doRequest: () => Promise<Response>,
  parseBody: (data: unknown) => FetchRatesResult | null,
): Promise<FetchRatesResult | null> {
  for (let attempt = 0; attempt < RATE_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await doRequest();
      if (isRetryableHttpStatus(response.status)) {
        if (attempt < RATE_FETCH_MAX_ATTEMPTS - 1) {
          await sleepMs(rateFetchBackoffDelayMs(attempt));
        }
        continue;
      }
      if (!response.ok) return null;

      const data: unknown = await response.json();
      const parsed = parseBody(data);
      if (parsed) return parsed;
      return null;
    }
    catch {
      if (attempt < RATE_FETCH_MAX_ATTEMPTS - 1) {
        await sleepMs(rateFetchBackoffDelayMs(attempt));
        continue;
      }
      return null;
    }
  }
  return null;
}

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
  const symbols = CURRENCY_VALUES.filter((c) => c !== 'EUR').join(',');
  return fetchRatesWithBackoff(
    () =>
      fetch(
        `https://api.frankfurter.app/latest?from=EUR&to=${symbols}`,
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

// ─── API 2: fawazahmed0 exchange-api (CDN-hosted, no auth, no rate limits) ───
// https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json

async function fetchFromFawazahmed0(): Promise<FetchRatesResult | null> {
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

// ─── API 3: Open ExchangeRate-API (free tier, no auth needed) ────────────────
// https://open.er-api.com/v6/latest/EUR

async function fetchFromOpenErApi(): Promise<FetchRatesResult | null> {
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

// ─── Exported: tries APIs in order, throws only if ALL fail ──────────────────

export async function fetchRates(): Promise<FetchRatesResult | undefined> {
  const result
    = (await fetchFromFrankfurter())
      ?? (await fetchFromFawazahmed0())
      ?? (await fetchFromOpenErApi());

  if (!result) {
    const err = new Error('All currency rate providers failed');
    console.error(err.message);
    captureError(err);
    return undefined;
  }

  return result;
}

// ─── Historical rate fetching ─────────────────────────────────────────────────
// Frankfurter and Fawazahmed0 both support historical dates; Open ER-API free
// tier does not, so we only try the first two providers.

async function fetchHistoricalFromFrankfurter(dateStr: string): Promise<FetchRatesResult | null> {
  const symbols = CURRENCY_VALUES.filter((c) => c !== 'EUR').join(',');
  return fetchRatesWithBackoff(
    () =>
      fetch(
        `https://api.frankfurter.app/${dateStr}?from=EUR&to=${symbols}`,
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

async function fetchHistoricalFromFawazahmed0(dateStr: string): Promise<FetchRatesResult | null> {
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
    const err = new Error(`Historical currency rate providers failed for date ${dateStr}`);
    console.error(err.message);
    captureError(err, { date: dateStr });
    return undefined;
  }

  return result;
}

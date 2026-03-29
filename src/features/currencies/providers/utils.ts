import type { RateMap } from './types';

import { CURRENCY_VALUES } from '../index';

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
export async function fetchRatesWithBackoff<T extends { source: string }>(
  doRequest: () => Promise<Response>,
  parseBody: (data: unknown) => T | null,
): Promise<T | null> {
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

export function filterSupportedRates(raw: Record<string, unknown>): RateMap {
  const result: RateMap = {};
  for (const key of CURRENCY_VALUES) {
    const val = raw[key.toLowerCase()] ?? raw[key];
    if (typeof val === 'number') {
      result[key] = val;
    }
  }
  return result;
}

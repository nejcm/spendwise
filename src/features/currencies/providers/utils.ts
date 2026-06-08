import type { RateMap } from './types';
import { UTCDate } from '@date-fns/utc';
import { subDays } from 'date-fns';

import { CURRENCY_VALUES } from '../index';

/** Attempts per provider before giving up (handles rate limits / transient errors). */
const RATE_FETCH_MAX_ATTEMPTS = 3;
const RATE_FETCH_INITIAL_BACKOFF_MS = 400;
export const RATE_FETCH_TIMEOUT_MS = 12_000;
export const HISTORICAL_DATE_WALKBACK_DAYS = 5;
/** Overall wall-clock budget for one historical lookup across walkback dates + providers. */
export const HISTORICAL_WALKBACK_BUDGET_MS = 30_000;
/** Tighter budget when a local SQLite cache can recover, so offline reads fall through fast. */
export const HISTORICAL_WALKBACK_CACHE_BUDGET_MS = 8_000;

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rateFetchBackoffDelayMs(attemptIndex: number): number {
  const exponential = RATE_FETCH_INITIAL_BACKOFF_MS * 2 ** attemptIndex;
  const jitter = Math.floor(Math.random() * 200);
  return exponential + jitter;
}

export function isRetryableHttpStatus(status: number): boolean {
  return (
    status === 408
    || status === 429
    || status === 502
    || status === 503
    || status === 504
  );
}

/**
 * Fetches `url` with a hard timeout. On timeout the in-flight request is
 * cancelled via `AbortController` (no leaked sockets / timers) and the rejection
 * surfaces to the caller. Each HTTP call is bounded individually — never a whole
 * mirror chain under one shared clock.
 */
export async function fetchWithTimeout(
  url: string,
  ms: number = RATE_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  }
  finally {
    clearTimeout(timer);
  }
}

/** Returns `dateStr` then up to `maxPriorDays` prior calendar dates (UTC). */
export function priorCalendarDates(dateStr: string, maxPriorDays: number): string[] {
  const dates = [dateStr];
  const anchor = new UTCDate(`${dateStr}T00:00:00Z`);
  for (let i = 1; i <= maxPriorDays; i++) {
    dates.push(subDays(anchor, i).toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Fetches JSON from `doRequest`, with exponential backoff retries when the
 * server signals rate limits / overload or the request fails transiently.
 *
 * `doRequest` is expected to bound its own network I/O (see `fetchWithTimeout`);
 * a thrown/aborted request is treated as a transient failure and retried.
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

export const RANGE_HISTORICAL_MAX_FETCHES = 100;

/** When `items` is longer than `maxCount`, returns up to `maxCount` evenly spaced picks (first and last included when `maxCount` ≥ 2). */
export function subsampleOrderedToMaxCount<T>(items: readonly T[], maxCount: number): T[] {
  const n = items.length;
  if (n === 0 || maxCount < 1) return [];
  if (n <= maxCount) return [...items];
  if (maxCount === 1) return [items[n - 1]!];
  const out: T[] = [];
  for (let j = 0; j < maxCount; j++) {
    out.push(items[Math.floor((j * (n - 1)) / (maxCount - 1))]!);
  }
  return out;
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

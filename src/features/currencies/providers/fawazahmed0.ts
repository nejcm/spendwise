import type { CurrencyRatesProvider, DateRangeRatesResult, FetchRatesResult, RateMap } from './types';
import { UTCDate } from '@date-fns/utc';
import { eachDayOfInterval } from 'date-fns';

import {
  fetchRatesWithBackoff,
  fetchWithTimeout,
  filterSupportedRates,
  RANGE_HISTORICAL_MAX_FETCHES,
  subsampleOrderedToMaxCount,
} from './utils';

const FAWAZAHMED0_RECENT_DAYS = 7;

function isoDatesInRange(startDate: string, endDate: string): string[] {
  const start = new UTCDate(`${startDate}T00:00:00Z`);
  const end = new UTCDate(`${endDate}T00:00:00Z`);
  return eachDayOfInterval({ start, end }).map((d) => d.toISOString().slice(0, 10));
}

export function buildMirrorUrls(dateTag: string): string[] {
  return [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${dateTag}/v1/currencies/eur.json`,
    `https://${dateTag}.currency-api.pages.dev/v1/currencies/eur.json`,
  ];
}

export function isWithinLastDays(dateStr: string, days: number): boolean {
  const date = new UTCDate(`${dateStr}T00:00:00Z`);
  const now = new UTCDate();
  const diffMs = now.getTime() - date.getTime();
  return diffMs >= 0 && diffMs <= days * 86_400_000;
}

export function dateTagsForHistorical(dateStr: string): string[] {
  const tags = [dateStr];
  if (isWithinLastDays(dateStr, FAWAZAHMED0_RECENT_DAYS)) {
    tags.push('latest');
  }
  return tags;
}

/**
 * Walks the mirror chain (each tag × jsDelivr/pages.dev), returning the first
 * `ok` response. Each request is individually timeout-bounded and aborted on
 * timeout. If every mirror fails with a response, the last one is returned so
 * the caller can inspect its status; if none produced a response (all threw),
 * we throw so the backoff layer treats it as a transient failure rather than a
 * fabricated 5xx.
 */
async function fetchFirstMirrorResponse(dateTags: readonly string[]): Promise<Response> {
  let lastResponse: Response | null = null;
  for (const tag of dateTags) {
    for (const url of buildMirrorUrls(tag)) {
      try {
        const response = await fetchWithTimeout(url);
        if (response.ok) return response;
        lastResponse = response;
      }
      catch {
        continue;
      }
    }
  }
  if (lastResponse) return lastResponse;
  throw new Error('fawazahmed0: all currency mirrors were unreachable');
}

function parseEurBody(data: unknown): FetchRatesResult | null {
  const d = data as { eur?: Record<string, number> };
  if (!d.eur) return null;
  const rates = filterSupportedRates(d.eur);
  rates.EUR = 1;
  return { rates, source: 'fawazahmed0' };
}

async function fetchLatestImpl(): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () => fetchFirstMirrorResponse(['latest']),
    (data) => {
      const parsed = parseEurBody(data);
      return parsed ? { ...parsed, source: 'fawazahmed0' } : null;
    },
  );
}

async function fetchHistoricalImpl(dateStr: string): Promise<FetchRatesResult | null> {
  return fetchRatesWithBackoff(
    () => fetchFirstMirrorResponse(dateTagsForHistorical(dateStr)),
    (data) => {
      const parsed = parseEurBody(data);
      return parsed ? { ...parsed, source: 'fawazahmed0-historical' } : null;
    },
  );
}

async function fetchRangeImpl(
  startDate: string,
  endDate: string,
): Promise<DateRangeRatesResult | null> {
  const dateStrs = subsampleOrderedToMaxCount(
    isoDatesInRange(startDate, endDate),
    RANGE_HISTORICAL_MAX_FETCHES,
  );
  const ratesByDate: Record<string, RateMap> = {};
  await Promise.all(
    dateStrs.map(async (dateStr) => {
      const result = await fetchHistoricalImpl(dateStr);
      if (result) ratesByDate[dateStr] = result.rates;
    }),
  );
  if (Object.keys(ratesByDate).length === 0) return null;
  return { ratesByDate, source: 'fawazahmed0-range-fallback' };
}

export const fawazahmed0Provider: CurrencyRatesProvider = {
  id: 'fawazahmed0',
  latest: fetchLatestImpl,
  historical: fetchHistoricalImpl,
  range: fetchRangeImpl,
};

import type { DateRangeRatesResult, FetchRatesResult, RateMap } from './providers/types';
import { captureError } from '@/lib/analytics';

import { splitBy } from '@/lib/date/helpers';
import { fetchFromFawazahmed0, fetchHistoricalFromFawazahmed0 } from './providers/fawazahmed0';
import { fetchFromFrankfurter, fetchHistoricalFromFrankfurter, fetchRangeFromFrankfurter } from './providers/frankfurter';
import { fetchFromOpenErApi } from './providers/open-er-api';

export type { DateRangeRatesResult, FetchRatesResult, RateMap };

// Current rates: tries providers in order
export async function fetchRates() {
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

// Historical (single date)
export async function fetchRatesForDate(dateStr: string) {
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

// Historical (date range)
export async function fetchRatesForDateRange(
  startDate: string,
  endDate: string,
) {
  const segments = splitBy(startDate, endDate, 3);
  if (segments.length === 0) {
    // fallback to single segment
    segments.push({ start: startDate, end: endDate });
  }

  const results = await Promise.allSettled(
    segments.map((seg) => fetchRangeFromFrankfurter(seg.start, seg.end)),
  );

  const merged: Record<string, RateMap> = {};
  for (const result of results) {
    if (result.status === 'rejected' || !result.value) {
      const err = new Error(`Date-range currency rate providers failed for ${startDate}..${endDate}`);
      console.error(err.message);
      captureError(err, { startDate, endDate: endDate ?? startDate });
      continue;
    }
    if (result.status === 'fulfilled') {
      Object.assign(merged, result.value.ratesByDate);
    }
  }

  return { ratesByDate: merged, source: 'frankfurter-range' };
}

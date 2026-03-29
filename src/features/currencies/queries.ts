import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';
import type { RateMap } from './service';

import { findClosestDateBinary, unixToISODate } from '@/lib/date/helpers';

import { fetchRates, fetchRatesForDate, fetchRatesForDateRange } from './service';

// ─── Types ───

export type CurrencyRate = {
  /** Base currency code (always `"EUR"`). */
  base: string;
  /** Quote currency code (e.g. `"USD"`). */
  quote: string;
  /** Exchange rate from base to quote. */
  rate: number;
  /** Day-truncated Unix timestamp (midnight UTC) when this rate was recorded. */
  date: number;
};

export type RatesMap = Record<string, number>;

const STALE_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Picks the stored rate snapshot date nearest to `?` using sargable MAX/MIN on
 * `date` (same bind repeated 6×). Tie → earlier snapshot (`d_before`).
 */
const CLOSEST_EUR_RATE_DATE_SQL = `
  SELECT CASE
    WHEN bx.d_before IS NULL THEN bx.d_after
    WHEN bx.d_after IS NULL THEN bx.d_before
    WHEN (? - bx.d_before) < (bx.d_after - ?) THEN bx.d_before
    WHEN (? - bx.d_before) > (bx.d_after - ?) THEN bx.d_after
    ELSE bx.d_before
  END
  FROM (
    SELECT
      (SELECT MAX(date) FROM currency_rates WHERE base = 'EUR' AND date <= ?) AS d_before,
      (SELECT MIN(date) FROM currency_rates WHERE base = 'EUR' AND date >= ?) AS d_after
  ) bx
`;

function closestRateDateParams(dateUnix: number) {
  return [dateUnix, dateUnix, dateUnix, dateUnix, dateUnix, dateUnix] as const;
}

// ─── Pure Conversion Helper ───

export function convertAmount(
  cents: number,
  from: CurrencyKey,
  to: CurrencyKey,
  rates: RatesMap,
): number {
  if (from === to) return cents;
  const fromRate = from === 'EUR' ? 1 : (rates[from] ?? 1);
  const toRate = to === 'EUR' ? 1 : (rates[to] ?? 1);
  return Math.round((cents / fromRate) * toRate);
}

// ─── Read Queries ───

/** Returns the most recently stored EUR-based rates. */
export async function getLatestRates(db: SQLiteDatabase): Promise<CurrencyRate[]> {
  return db.getAllAsync<CurrencyRate>(
    `SELECT base, quote, rate, date
     FROM currency_rates
     WHERE base = 'EUR' AND date = (
       SELECT MAX(date) FROM currency_rates WHERE base = 'EUR'
     )`,
  );
}

/** Returns the Unix timestamp (seconds) of the most recent stored rate. */
export async function getLastFetchedAt(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ last: number | null }>(
    `SELECT MAX(date) as last FROM currency_rates`,
  );
  return row?.last ?? null;
}

/**
 * Returns the EUR-based rates for the closest date on or before `dateUnix`.
 * If no rates exist for that date range, fetches historical rates from the API
 * and saves them before returning. Falls back to the oldest available rates only
 * if the historical fetch also fails.
 */
export async function getRatesForDate(db: SQLiteDatabase, dateUnix: number): Promise<RatesMap> {
  const rows = await db.getAllAsync<{ quote: string; rate: number }>(
    `SELECT quote, rate
     FROM currency_rates
     WHERE base = 'EUR' AND date = (${CLOSEST_EUR_RATE_DATE_SQL})`,
    [...closestRateDateParams(dateUnix)],
  );

  if (rows.length > 0) return toRatesMap(rows);

  // No local rates found — try fetching historical rates for that specific date
  const dayTimestamp = dateUnix - (dateUnix % 86400);
  const dateStr = new Date(dayTimestamp * 1000).toISOString().slice(0, 10);
  const fetched = await fetchRatesForDate(dateStr);

  if (fetched) {
    await saveRatesForDate(db, fetched.rates, dayTimestamp);
    return toRatesMap(
      Object.entries(fetched.rates)
        .filter(([, v]) => v != null)
        .map(([quote, rate]) => ({ quote, rate: rate as number })),
    );
  }

  // Final fallback: use rates from the closest available date
  const fallback = await db.getAllAsync<{ quote: string; rate: number }>(
    `SELECT quote, rate
     FROM currency_rates
     WHERE base = 'EUR' AND date = (${CLOSEST_EUR_RATE_DATE_SQL})`,
    [...closestRateDateParams(dateUnix)],
  );
  return toRatesMap(fallback);
}

/**
 * From a record of date-keyed rate maps, finds the rates for the date closest
 * to `targetDateStr`. Prefers the latest date on-or-before the target; if none
 * exists, uses the earliest date after.
 */
function findClosestDateRates(
  targetDateStr: string,
  ratesByDate: Record<string, RateMap>,
): RateMap | undefined {
  const dates = Object.keys(ratesByDate).sort();
  if (dates.length === 0) return undefined;

  let best: string | undefined;
  for (const d of dates) {
    if (d <= targetDateStr) best = d;
    else break;
  }
  return ratesByDate[best ?? dates[0]];
}

const TOLERANCE_SEC = 7 * 86400; // 7 days

/** Saves all rates in a single transaction (INSERT OR IGNORE — idempotent). */
export async function bulkSaveRates(
  db: SQLiteDatabase,
  ratesByDate: Record<string, RateMap>,
): Promise<void> {
  const entries = Object.entries(ratesByDate);
  if (entries.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const [dateStr, rates] of entries) {
      const ts = Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
      for (const [quote, rate] of Object.entries(rates)) {
        if (rate == null) continue;
        await db.runAsync(
          `INSERT OR IGNORE INTO currency_rates (base, quote, rate, date)
           VALUES ('EUR', ?, ?, ?)`,
          [quote, rate, ts],
        );
      }
    }
  });
}

/**
 * Batch-fetches EUR-based rates for multiple dates. Uses a single range query
 * to load cached rates, binary search for closest-date matching, gap detection
 * for targeted API fetches, and bulk saves in one transaction.
 */
export async function getRatesForDates(
  db: SQLiteDatabase,
  dateUnixArray: number[],
): Promise<Map<number, RatesMap>> {
  if (dateUnixArray.length === 0) return new Map();

  // Build mapping: original input → day-truncated. Results keyed by original.
  const truncatedToOriginals = new Map<number, number[]>();
  for (const raw of dateUnixArray) {
    const trunc = raw - (raw % 86400);
    const list = truncatedToOriginals.get(trunc) ?? [];
    list.push(raw);
    truncatedToOriginals.set(trunc, list);
  }

  const unique = [...truncatedToOriginals.keys()];
  const minDate = Math.min(...unique);
  const maxDate = Math.max(...unique);

  // Phase 1: Load all cached rate dates in one range query (padded by tolerance)
  const storedDateRows = await db.getAllAsync<{ date: number }>(
    `SELECT DISTINCT date FROM currency_rates
     WHERE base = 'EUR' AND date BETWEEN ? AND ?
     ORDER BY date ASC`,
    [minDate - TOLERANCE_SEC, maxDate + TOLERANCE_SEC],
  );
  const storedDates = storedDateRows.map((r) => r.date);

  // Phase 2: Binary search to partition into hits and misses
  const hitDatesMap = new Map<number, number>(); // truncated → closestStoredDate
  const missDates: number[] = [];

  for (const trunc of unique) {
    const closest = findClosestDateBinary(storedDates, trunc, TOLERANCE_SEC);
    if (closest !== undefined) {
      hitDatesMap.set(trunc, closest);
    }
    else {
      missDates.push(trunc);
    }
  }

  // Phase 3: Batch-load rates for all hit dates (1 query)
  const truncResult = new Map<number, RatesMap>(); // truncated → rates
  const uniqueStoredDates = [...new Set(hitDatesMap.values())];

  if (uniqueStoredDates.length > 0) {
    const ratesByStoredDate = new Map<number, RatesMap>();

    // Chunk to stay within SQLite bind-param limit (999)
    const CHUNK_SIZE = 900;
    for (let i = 0; i < uniqueStoredDates.length; i += CHUNK_SIZE) {
      const chunk = uniqueStoredDates.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '?').join(',');
      const rows = await db.getAllAsync<{ date: number; quote: string; rate: number }>(
        `SELECT date, quote, rate FROM currency_rates
         WHERE base = 'EUR' AND date IN (${placeholders})`,
        chunk,
      );

      for (const row of rows) {
        const existing = ratesByStoredDate.get(row.date);
        ratesByStoredDate.set(row.date, existing
          ? { ...existing, [row.quote]: row.rate }
          : { EUR: 1, [row.quote]: row.rate });
      }
    }

    for (const [trunc, storedDate] of hitDatesMap) {
      const rates = ratesByStoredDate.get(storedDate);
      if (rates) truncResult.set(trunc, rates);
      else missDates.push(trunc); // demoted: DB had the date but no rate rows
    }
  }

  // Phase 4: Fetch entire years that have gaps
  const allMissDates = [...new Set(missDates)];
  if (allMissDates.length > 0) {
    const years = [...new Set(allMissDates.map((d) => new Date(d * 1000).getUTCFullYear()))];
    const fetches = await Promise.allSettled(
      years.map((y) => fetchRatesForDateRange(`${y}-01-01`, `${y}-12-31`)),
    );

    const merged: Record<string, RateMap> = {};
    for (const f of fetches) {
      if (f.status === 'fulfilled' && f.value) {
        Object.assign(merged, f.value.ratesByDate);
      }
    }

    // Phase 5: Bulk save
    await bulkSaveRates(db, merged);

    // Phase 6: Resolve miss dates from fetched data
    for (const trunc of allMissDates) {
      if (truncResult.has(trunc)) continue;
      const dateStr = unixToISODate(trunc);
      const exact = merged[dateStr];
      const rates = exact ?? findClosestDateRates(dateStr, merged);
      if (rates) {
        truncResult.set(trunc, toRatesMap(
          Object.entries(rates)
            .filter(([, v]) => v != null)
            .map(([quote, rate]) => ({ quote, rate: rate as number })),
        ));
      }
    }

    // Final fallback: any dates still unresolved, fetch individually
    const stillMissing = unique.filter((d) => !truncResult.has(d));
    if (stillMissing.length > 0) {
      await Promise.all(
        stillMissing.map(async (trunc) => {
          truncResult.set(trunc, await getRatesForDate(db, trunc));
        }),
      );
    }
  }

  // Map truncated results back to all original input values
  const result = new Map<number, RatesMap>();
  for (const [trunc, rates] of truncResult) {
    for (const original of truncatedToOriginals.get(trunc) ?? []) {
      result.set(original, rates);
    }
  }

  return result;
}

// ─── Write Queries ───

/** Appends today's rates to the historical table (INSERT OR IGNORE — idempotent per day). */
export async function saveRates(
  db: SQLiteDatabase,
  rateMap: RateMap,
): Promise<void> {
  const today = Math.floor(Date.now() / 1000);
  const dayTimestamp = today - (today % 86400); // truncate to midnight UTC
  await saveRatesForDate(db, rateMap, dayTimestamp);
}

/** Saves rates for a specific day-truncated Unix timestamp (INSERT OR IGNORE — idempotent per day). */
export async function saveRatesForDate(
  db: SQLiteDatabase,
  rateMap: RateMap,
  dayTimestamp: number,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const [quote, rate] of Object.entries(rateMap)) {
      if (rate == null) continue;
      await db.runAsync(
        `INSERT OR IGNORE INTO currency_rates (base, quote, rate, date)
         VALUES ('EUR', ?, ?, ?)`,
        [quote, rate, dayTimestamp],
      );
    }
  });
}

// ─── Composite Operations ───

export function toRatesMap(rows: Array<{ quote: string; rate: number }>): RatesMap {
  const map: RatesMap = { EUR: 1 };
  for (const r of rows) {
    map[r.quote] = r.rate;
  }
  return map;
}

export async function loadOrFetchRates(db: SQLiteDatabase): Promise<RatesMap | undefined> {
  const lastFetched = await getLastFetchedAt(db);
  const isStale = !lastFetched || Math.floor(Date.now() / 1000) - lastFetched > STALE_SECONDS;

  if (!isStale) {
    const rows = await getLatestRates(db);
    if (rows.length > 0) return toRatesMap(rows);
  }

  return refreshRates(db);
}

export async function refreshRates(db: SQLiteDatabase): Promise<RatesMap | undefined> {
  const result = await fetchRates();
  if (!result) return undefined;
  await saveRates(db, result.rates);
  const rows = await getLatestRates(db);
  return toRatesMap(rows);
}

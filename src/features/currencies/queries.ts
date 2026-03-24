import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';
import type { RateMap } from './service';

import { fetchRates, fetchRatesForDate } from './service';

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

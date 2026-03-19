import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';
import type { RateMap } from './service';

import { fetchRates } from './service';

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
 * Falls back to the oldest available rates if nothing is found before that date.
 */
export async function getRatesForDate(db: SQLiteDatabase, dateUnix: number): Promise<RatesMap> {
  const rows = await db.getAllAsync<{ quote: string; rate: number }>(
    `SELECT quote, rate
     FROM currency_rates
     WHERE base = 'EUR' AND date = (
       SELECT MAX(date) FROM currency_rates WHERE base = 'EUR' AND date <= ?
     )`,
    [dateUnix],
  );

  if (rows.length === 0) {
    // Fallback: use oldest available rates
    const fallback = await db.getAllAsync<{ quote: string; rate: number }>(
      `SELECT quote, rate
       FROM currency_rates
       WHERE base = 'EUR' AND date = (
         SELECT MIN(date) FROM currency_rates WHERE base = 'EUR'
       )`,
    );
    return toRatesMap(fallback);
  }

  return toRatesMap(rows);
}

// ─── Write Queries ───

/** Appends today's rates to the historical table (INSERT OR IGNORE — idempotent per day). */
export async function saveRates(
  db: SQLiteDatabase,
  rateMap: RateMap,
): Promise<void> {
  const today = Math.floor(Date.now() / 1000);
  const dayTimestamp = today - (today % 86400); // truncate to midnight UTC

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

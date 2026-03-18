import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';
import type { RateMap } from './service';

import { fetchRates } from './service';

// ─── Types ───

export type CurrencyRate = {
  base: string;
  quote: string;
  rate: number;
  source: string;
  fetched_at: number; // Unix seconds
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
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return cents;
  return Math.round((cents / fromRate) * toRate);
}

// ─── Read Queries ───

export async function getRates(db: SQLiteDatabase): Promise<CurrencyRate[]> {
  return db.getAllAsync<CurrencyRate>(
    `SELECT * FROM currency_rates WHERE base = 'EUR'`,
  );
}

export async function getLastFetchedAt(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ last: number | null }>(
    `SELECT MAX(fetched_at) as last FROM currency_rates`,
  );
  return row?.last ?? null;
}

// ─── Write Queries ───

export async function saveRates(
  db: SQLiteDatabase,
  rateMap: RateMap,
  source: string,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  await db.withTransactionAsync(async () => {
    for (const [quote, rate] of Object.entries(rateMap)) {
      if (rate == null) continue;
      await db.runAsync(
        `INSERT OR REPLACE INTO currency_rates (base, quote, rate, source, fetched_at)
         VALUES ('EUR', ?, ?, ?, ?)`,
        [quote, rate, source, now],
      );
    }
  });
}

// ─── Composite Operations ───

export function toRatesMap(rows: CurrencyRate[]): RatesMap {
  return Object.fromEntries(rows.map((r) => [r.quote, r.rate]));
}

export async function loadOrFetchRates(db: SQLiteDatabase): Promise<RatesMap | undefined> {
  const lastFetched = await getLastFetchedAt(db);
  const isStale = !lastFetched || Math.floor(Date.now() / 1000) - lastFetched > STALE_SECONDS;

  if (!isStale) {
    const rows = await getRates(db);
    if (rows.length > 0) return toRatesMap(rows);
  }

  return refreshRates(db);
}

export async function refreshRates(db: SQLiteDatabase): Promise<RatesMap | undefined> {
  const result = await fetchRates();
  if (!result) return undefined;
  const { rates, source } = result;
  await saveRates(db, rates, source);
  const rows = await getRates(db);
  return toRatesMap(rows);
}

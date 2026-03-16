import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from './';
import type { RateMap } from './service';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { fetchRates } from './service';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CurrencyRate = {
  base: string;
  quote: string;
  rate: number;
  source: string;
  fetched_at: string;
};

/** EUR-based rate map: { USD: 1.09, GBP: 0.85, ... } */
export type RatesMap = Record<string, number>;

const STALE_MS = 24 * 60 * 60_000; // 24 hours

// ─── Query Keys ───────────────────────────────────────────────────────────────

const keys = {
  rates: ['currency-rates'] as const,
};

// ─── React Query Hooks ────────────────────────────────────────────────────────

/**
 * Returns EUR-based exchange rates. Reads from SQLite; if the cache is older
 * than 24 hours (or empty), fetches fresh data from the API and saves it.
 */
export function useCurrencyRates() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.rates,
    queryFn: () => loadOrFetchRates(db),
    staleTime: STALE_MS,
  });
}

/**
 * Force-refreshes rates from the API, ignoring cache age.
 */
export function useRefreshRates() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshRates(db),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.rates });
    },
  });
}

// ─── Pure Conversion Helper ───────────────────────────────────────────────────

/**
 * Converts an amount in cents from one currency to another using EUR-based rates.
 * Returns the result in cents.
 *
 * @example convertAmount(1000, 'USD', 'GBP', rates) // 1000 USD cents → GBP cents
 */
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
  // Convert to EUR first, then to target currency
  return Math.round((cents / fromRate) * toRate);
}

// ─── Database Functions ───────────────────────────────────────────────────────

async function getRates(db: SQLiteDatabase): Promise<CurrencyRate[]> {
  return db.getAllAsync<CurrencyRate>(
    `SELECT * FROM currency_rates WHERE base = 'EUR'`,
  );
}

async function getLastFetchedAt(db: SQLiteDatabase): Promise<string | null> {
  const row = await db.getFirstAsync<{ last: string | null }>(
    `SELECT MAX(fetched_at) as last FROM currency_rates`,
  );
  return row?.last ?? null;
}

async function saveRates(
  db: SQLiteDatabase,
  rateMap: RateMap,
  source: string,
): Promise<void> {
  const now = new Date().toISOString();
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

// ─── Internal Logic ───────────────────────────────────────────────────────────

function toRatesMap(rows: CurrencyRate[]): RatesMap {
  return Object.fromEntries(rows.map((r) => [r.quote, r.rate]));
}

async function loadOrFetchRates(db: SQLiteDatabase): Promise<RatesMap | undefined> {
  const lastFetched = await getLastFetchedAt(db);
  const isStale
    = !lastFetched || Date.now() - new Date(lastFetched).getTime() > STALE_MS;

  if (!isStale) {
    const rows = await getRates(db);
    if (rows.length > 0) return toRatesMap(rows);
  }

  return refreshRates(db);
}

async function refreshRates(db: SQLiteDatabase): Promise<RatesMap | undefined> {
  const result = await fetchRates();
  if (!result) return undefined;
  const { rates, source } = result;
  await saveRates(db, rates, source);
  const rows = await getRates(db);
  return toRatesMap(rows);
}

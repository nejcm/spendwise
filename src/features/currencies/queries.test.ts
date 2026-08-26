import type { CurrencyKey } from '.';

import { createTestDb } from '@/test-utils/sqlite-db';
import { CURRENCY_VALUES } from '.';
import {
  convertAmount,
  getLastFetchedAt,
  getLatestRates,
  getRatesForDate,
  loadOrFetchRates,
  saveRates,
  toRatesMap,
} from './queries';

jest.mock('./service', () => ({
  fetchRates: jest.fn(),
  fetchRatesForDate: jest.fn().mockResolvedValue(null),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

const { fetchRates, fetchRatesForDate } = jest.requireMock('./service') as {
  fetchRates: jest.Mock;
  fetchRatesForDate: jest.Mock;
};

// Several tests freeze Date.now(); restore unconditionally so a failed
// assertion cannot leak the frozen clock into later tests.
afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seedRate(
  db: Awaited<ReturnType<typeof createTestDb>>,
  quote: string,
  rate: number,
  date: number,
) {
  await db.runAsync(
    `INSERT OR IGNORE INTO currency_rates (base, quote, rate, date) VALUES ('EUR', ?, ?, ?)`,
    [quote, rate, date],
  );
}

async function seedRateSnapshot(
  db: Awaited<ReturnType<typeof createTestDb>>,
  date: number,
  usdRate: number,
) {
  for (const quote of CURRENCY_VALUES) {
    await seedRate(db, quote, quote === 'USD' ? usdRate : 1, date);
  }
}

function rateSnapshot(usdRate: number) {
  return Object.fromEntries(CURRENCY_VALUES.map((quote) => [quote, quote === 'USD' ? usdRate : 1]));
}

// ─── toRatesMap ───────────────────────────────────────────────────────────────

describe('toRatesMap', () => {
  it('always includes EUR: 1', () => {
    expect(toRatesMap([])).toEqual({ EUR: 1 });
  });

  it('merges rows into a keyed map', () => {
    const rows = [
      { quote: 'USD', rate: 1.08 },
      { quote: 'GBP', rate: 0.86 },
    ];
    expect(toRatesMap(rows)).toEqual({ EUR: 1, USD: 1.08, GBP: 0.86 });
  });
});

// ─── getRatesForDate ──────────────────────────────────────────────────────────

describe('getRatesForDate', () => {
  it('returns the closest rate on or before the given date', async () => {
    const db = await createTestDb();
    await seedRate(db, 'USD', 1.08, 1_770_000_000);
    await seedRate(db, 'USD', 1.09, 1_780_000_000);
    await seedRate(db, 'USD', 1.10, 1_790_000_000);
    await seedRate(db, 'USD', 1.11, 1_800_000_000);
    await seedRate(db, 'USD', 1.12, 1_810_000_000);

    const rates = await getRatesForDate(db as any, 1_786_000_000);
    expect(rates.USD).toBe(1.10);

    const rates2 = await getRatesForDate(db as any, 1_784_000_000);
    expect(rates2.USD).toBe(1.09);
  });

  it('picks the earlier snapshot when queried before the second one', async () => {
    const db = await createTestDb();
    await seedRate(db, 'USD', 1.05, 1_760_000_000);
    await seedRate(db, 'USD', 1.08, 1_770_000_000);

    const rates = await getRatesForDate(db as any, 1_760_000_000);
    expect(rates.USD).toBe(1.05);
  });

  it('picks the nearest rate when queried between two snapshots', async () => {
    const db = await createTestDb();
    await seedRate(db, 'USD', 1.00, 1_750_000_000); // farther away
    await seedRate(db, 'USD', 1.08, 1_770_000_000); // closer to query date

    // 1_769_000_000 is 1M from 1_770_000_000 but 19M from 1_750_000_000 — nearest wins
    const rates = await getRatesForDate(db as any, 1_769_000_000);
    expect(rates.USD).toBe(1.08);
  });

  it('returns rates from the only available date when no exact match exists', async () => {
    const db = await createTestDb();
    await seedRate(db, 'USD', 1.1, 1_600_000_000);

    const rates = await getRatesForDate(db as any, 1_577_836_800); // earlier than seeded
    expect(rates.USD).toBe(1.1);
  });

  it('returns { EUR: 1 } when currency_rates is empty', async () => {
    const db = await createTestDb();
    const rates = await getRatesForDate(db as any, 1_777_766_400);
    expect(rates).toEqual({ EUR: 1 });
  });

  it('does not fetch missing rates when fetchIfMissing is false', async () => {
    const db = await createTestDb();
    fetchRatesForDate.mockClear();

    const rates = await getRatesForDate(db as any, 1_777_766_400, { fetchIfMissing: false });

    expect(fetchRatesForDate).not.toHaveBeenCalled();
    expect(rates).toEqual({ EUR: 1 });
  });

  it('always includes EUR: 1 in the result', async () => {
    const db = await createTestDb();
    await seedRate(db, 'USD', 1.08, 1_760_000_000);

    const rates = await getRatesForDate(db as any, 1_760_000_000);
    expect(rates.EUR).toBe(1);
  });
});

// ─── saveRates ────────────────────────────────────────────────────────────────

describe('saveRates', () => {
  it('inserts rates keyed by day-truncated timestamp', async () => {
    const db = await createTestDb();
    jest.spyOn(Date, 'now').mockReturnValue(1_762_345_678_000);

    await saveRates(db as any, { USD: 1.08, GBP: 0.86 });

    const rows = await db.getAllAsync<{ quote: string; rate: number; date: number }>(
      `SELECT quote, rate, date FROM currency_rates WHERE base = 'EUR' ORDER BY quote`,
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.quote === 'USD')!.rate).toBe(1.08);
    expect(rows.find((r) => r.quote === 'USD')!.date).toBe(1_762_300_800);
    expect(rows.find((r) => r.quote === 'GBP')!.rate).toBe(0.86);
  });

  it('upserts — a same-day refresh replaces the rate instead of duplicating rows', async () => {
    const db = await createTestDb();
    jest.spyOn(Date, 'now').mockReturnValue(1_762_345_678_000);

    await saveRates(db as any, { USD: 1.08 });
    await saveRates(db as any, { USD: 1.99 }); // second call on same day — overwrites

    const rows = await db.getAllAsync<{ quote: string; rate: number }>(
      `SELECT quote, rate FROM currency_rates WHERE base = 'EUR' AND quote = 'USD'`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].rate).toBe(1.99); // latest rate wins
  });
});

// ─── getLatestRates ───────────────────────────────────────────────────────────

describe('getLatestRates', () => {
  it('returns rates for the most recent date only', async () => {
    const db = await createTestDb();
    await seedRate(db, 'USD', 1.05, 1_760_000_000);
    await seedRate(db, 'USD', 1.08, 1_770_000_000); // later — should win

    const rows = await getLatestRates(db as any);
    expect(rows).toHaveLength(1);
    expect(rows[0].rate).toBe(1.08);
  });

  it('returns empty array when no rates exist', async () => {
    const db = await createTestDb();
    expect(await getLatestRates(db as any)).toEqual([]);
  });
});

// ─── getLastFetchedAt ─────────────────────────────────────────────────────────

describe('getLastFetchedAt', () => {
  it('returns null when currency_rates is empty', async () => {
    const db = await createTestDb();
    expect(await getLastFetchedAt(db as any)).toBeNull();
  });

  it('returns the MAX date when rows exist', async () => {
    const db = await createTestDb();
    await seedRate(db, 'USD', 1.05, 1_760_000_000);
    await seedRate(db, 'USD', 1.08, 1_770_000_000);

    expect(await getLastFetchedAt(db as any)).toBe(1_770_000_000);
  });
});

describe('loadOrFetchRates', () => {
  it('uses the current-day cache without fetching', async () => {
    const db = await createTestDb();
    const now = Date.UTC(2026, 7, 27, 12) / 1000;
    const today = now - (now % 86400);
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);
    await seedRateSnapshot(db, today, 1.08);
    fetchRates.mockClear();

    await expect(loadOrFetchRates(db as any)).resolves.toMatchObject({ EUR: 1, USD: 1.08 });
    expect(fetchRates).not.toHaveBeenCalled();
  });

  it('refreshes an incomplete current-day cache', async () => {
    const db = await createTestDb();
    const now = Date.UTC(2026, 7, 27, 12) / 1000;
    const today = now - (now % 86400);
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);
    await seedRate(db, 'USD', 1.08, today);
    fetchRates.mockClear();

    fetchRates.mockResolvedValueOnce({ rates: rateSnapshot(1.09), source: 'test' });
    const rates = await loadOrFetchRates(db as any);
    expect(Object.keys(rates ?? {})).toEqual(expect.arrayContaining(CURRENCY_VALUES));
    expect(fetchRates).toHaveBeenCalledTimes(1);
  });

  it('overwrites stale rates when refreshing an incomplete current-day cache', async () => {
    const db = await createTestDb();
    const now = Date.UTC(2026, 7, 27, 12) / 1000;
    const today = now - (now % 86400);
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);
    await seedRate(db, 'USD', 1.08, today);
    fetchRates.mockResolvedValueOnce({ rates: rateSnapshot(1.09), source: 'test' });

    await expect(loadOrFetchRates(db as any)).resolves.toMatchObject({ EUR: 1, USD: 1.09 });

    const saved = await db.getAllAsync<{ rate: number }>(
      `SELECT rate FROM currency_rates WHERE quote = 'USD' AND date = ?`,
      [today],
    );
    expect(saved).toEqual([{ rate: 1.09 }]);
  });

  it('refreshes an older cache', async () => {
    const db = await createTestDb();
    const now = Date.UTC(2026, 7, 27, 12) / 1000;
    const today = now - (now % 86400);
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);
    await seedRate(db, 'USD', 1.08, today - 86400);

    fetchRates.mockResolvedValueOnce({ rates: rateSnapshot(1.09), source: 'test' });
    await expect(loadOrFetchRates(db as any)).resolves.toMatchObject({ EUR: 1, USD: 1.09 });

    const saved = await db.getAllAsync<{ date: number; rate: number }>(
      `SELECT date, rate FROM currency_rates WHERE quote = 'USD' AND date = ?`,
      [today],
    );
    expect(saved).toEqual([{ date: today, rate: 1.09 }]);

    fetchRates.mockClear();
    await loadOrFetchRates(db as any);
    expect(fetchRates).not.toHaveBeenCalled();
  });

  it('keeps an older cache when refresh fails', async () => {
    const db = await createTestDb();
    const now = Date.UTC(2026, 7, 27, 12) / 1000;
    const today = now - (now % 86400);
    jest.spyOn(Date, 'now').mockReturnValue(now * 1000);
    await seedRateSnapshot(db, today - 86400, 1.08);
    fetchRates.mockRejectedValueOnce(new Error('offline'));
    await expect(loadOrFetchRates(db as any)).resolves.toMatchObject({ EUR: 1, USD: 1.08 });
  });
});

// ─── convertAmount ────────────────────────────────────────────────────────────

describe('convertAmount', () => {
  const rates = { EUR: 1, USD: 1.08, GBP: 0.86 };

  it('returns cents unchanged when from === to', () => {
    expect(convertAmount(10_000, 'USD', 'USD', rates)).toBe(10_000);
  });

  it('converts EUR → USD', () => {
    expect(convertAmount(10_000, 'EUR', 'USD', rates)).toBe(10_800);
  });

  it('converts USD → EUR (inverse, rounds to nearest cent)', () => {
    // 10_000 / 1.08 * 1 = 9259.259... → Math.round → 9259
    expect(convertAmount(10_000, 'USD', 'EUR', rates)).toBe(9259);
  });

  it('converts between two non-EUR currencies', () => {
    // 10_000 / 1.08 * 0.86 = 7962.96... → Math.round → 7963
    expect(convertAmount(10_000, 'USD', 'GBP', rates)).toBe(7963);
  });

  it('falls back to rate 1 when currency is missing from rates', () => {
    // Unknown currency treated as EUR-equivalent (rate ?? 1 = 1)
    expect(convertAmount(10_000, 'EUR', 'XXX' as CurrencyKey, {})).toBe(10_000);
  });
});

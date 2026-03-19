import { BASE_SCHEMA, createTestDb } from '@/test-utils/sqlite-db';
import { getRatesForDate, saveRates, toRatesMap } from './queries';

function makeDb() {
  return createTestDb(BASE_SCHEMA);
}

/** Midnight UTC for a given ISO date string → unix seconds. */
function dayUnix(iso: string) {
  return Math.floor(new Date(iso).getTime() / 1000);
}

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

describe('getRatesForDate', () => {
  it('returns the closest rate on or before the given date', async () => {
    const db = makeDb();

    // Seed two rate snapshots
    db._raw.exec(`
      INSERT INTO currency_rates (base, quote, rate, date) VALUES
        ('EUR', 'USD', 1.05, ${dayUnix('2026-01-01')}),
        ('EUR', 'USD', 1.08, ${dayUnix('2026-02-01')});
    `);

    const rates = await getRatesForDate(db as any, dayUnix('2026-02-15'));
    expect(rates.USD).toBe(1.08);
  });

  it('picks the earlier snapshot when queried before the second one', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO currency_rates (base, quote, rate, date) VALUES
        ('EUR', 'USD', 1.05, ${dayUnix('2026-01-01')}),
        ('EUR', 'USD', 1.08, ${dayUnix('2026-02-01')});
    `);

    const rates = await getRatesForDate(db as any, dayUnix('2026-01-15'));
    expect(rates.USD).toBe(1.05);
  });

  it('falls back to the oldest rates when no rate exists before the date', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO currency_rates (base, quote, rate, date) VALUES
        ('EUR', 'USD', 1.10, ${dayUnix('2026-03-01')});
    `);

    // Ask for a date well before the only stored rate
    const rates = await getRatesForDate(db as any, dayUnix('2020-01-01'));
    expect(rates.USD).toBe(1.10);
  });

  it('returns { EUR: 1 } when currency_rates is empty', async () => {
    const db = makeDb();
    const rates = await getRatesForDate(db as any, dayUnix('2026-03-01'));
    expect(rates).toEqual({ EUR: 1 });
  });

  it('always includes EUR: 1 in the result', async () => {
    const db = makeDb();
    db._raw.exec(`
      INSERT INTO currency_rates (base, quote, rate, date) VALUES
        ('EUR', 'USD', 1.08, ${dayUnix('2026-01-01')});
    `);
    const rates = await getRatesForDate(db as any, dayUnix('2026-01-15'));
    expect(rates.EUR).toBe(1);
  });
});

describe('saveRates', () => {
  it('inserts today\'s rates keyed by day-truncated timestamp', async () => {
    const db = makeDb();
    await saveRates(db as any, { USD: 1.08, GBP: 0.86 });

    const rows = db._raw.prepare(`SELECT quote, rate FROM currency_rates WHERE base = 'EUR'`).all() as { quote: string; rate: number }[];
    const map = Object.fromEntries(rows.map((r) => [r.quote, r.rate]));
    expect(map.USD).toBe(1.08);
    expect(map.GBP).toBe(0.86);
  });

  it('is idempotent — second call does not overwrite', async () => {
    const db = makeDb();
    await saveRates(db as any, { USD: 1.08 });
    await saveRates(db as any, { USD: 1.99 }); // same day — should be ignored

    const row = db._raw.prepare(`SELECT rate FROM currency_rates WHERE base = 'EUR' AND quote = 'USD'`).get([]) as { rate: number };
    expect(row.rate).toBe(1.08);
  });
});

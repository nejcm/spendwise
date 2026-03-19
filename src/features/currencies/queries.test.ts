import { getRatesForDate, saveRates, toRatesMap } from './queries';

function createMockDb() {
  return {
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
    withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
  };
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
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([{ quote: 'USD', rate: 1.08 }]);

    const rates = await getRatesForDate(db as any, 1_770_000_000);
    expect(rates.USD).toBe(1.08);
  });

  it('picks the earlier snapshot when queried before the second one', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([{ quote: 'USD', rate: 1.05 }]);

    const rates = await getRatesForDate(db as any, 1_760_000_000);
    expect(rates.USD).toBe(1.05);
  });

  it('falls back to the oldest rates when no rate exists before the date', async () => {
    const db = createMockDb();
    db.getAllAsync
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ quote: 'USD', rate: 1.1 }]);

    const rates = await getRatesForDate(db as any, 1_577_836_800);
    expect(rates.USD).toBe(1.10);
  });

  it('returns { EUR: 1 } when currency_rates is empty', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const rates = await getRatesForDate(db as any, 1_777_766_400);
    expect(rates).toEqual({ EUR: 1 });
  });

  it('always includes EUR: 1 in the result', async () => {
    const db = createMockDb();
    db.getAllAsync.mockResolvedValueOnce([{ quote: 'USD', rate: 1.08 }]);
    const rates = await getRatesForDate(db as any, 1_760_000_000);
    expect(rates.EUR).toBe(1);
  });
});

describe('saveRates', () => {
  it('inserts today\'s rates keyed by day-truncated timestamp', async () => {
    const db = createMockDb();
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_762_345_678_000); // fixed day
    await saveRates(db as any, { USD: 1.08, GBP: 0.86 });

    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    expect(db.runAsync).toHaveBeenCalledTimes(2);
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO currency_rates'),
      ['USD', 1.08, 1_762_300_800],
    );
    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO currency_rates'),
      ['GBP', 0.86, 1_762_300_800],
    );
    dateNowSpy.mockRestore();
  });

  it('uses INSERT OR IGNORE so repeated calls are idempotent at SQL level', async () => {
    const db = createMockDb();
    await saveRates(db as any, { USD: 1.08 });
    await saveRates(db as any, { USD: 1.99 });

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT OR IGNORE INTO currency_rates'),
      expect.any(Array),
    );
  });
});

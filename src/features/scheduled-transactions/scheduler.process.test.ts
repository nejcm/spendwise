import { CURRENCY_VALUES } from '@/features/currencies';
import { createTestDb } from '@/test-utils/sqlite-db';
import { isoDateToUnix, processDueScheduledTransactions } from './scheduler';

jest.mock('@/features/currencies/service', () => ({
  fetchRates: jest.fn(),
  fetchRatesForDate: jest.fn(),
  fetchRatesForDateRange: jest.fn(),
}));

let mockIdCounter = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () => `id-${++mockIdCounter}`,
}));

jest.mock('@/lib/store/store', () => ({
  getAppState: () => ({ currency: 'EUR' }),
}));

const { fetchRatesForDate, fetchRatesForDateRange } = jest.requireMock('@/features/currencies/service') as {
  fetchRatesForDate: jest.Mock;
  fetchRatesForDateRange: jest.Mock;
};

describe('processDueScheduledTransactions', () => {
  it('converts with cached rates offline and never fetches inside the write transaction', async () => {
    const db = await createTestDb();
    const today = isoDateToUnix('2026-03-10');
    let inTransaction = false;
    const fetchedInTransaction: boolean[] = [];
    const offline = () => {
      fetchedInTransaction.push(inTransaction);
      return Promise.reject(new Error('offline'));
    };
    fetchRatesForDate.mockImplementation(offline);
    fetchRatesForDateRange.mockImplementation(offline);

    const withTransactionAsync = db.withTransactionAsync;
    db.withTransactionAsync = async (cb) => {
      inTransaction = true;
      try {
        await withTransactionAsync(cb);
      }
      finally {
        inTransaction = false;
      }
    };

    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency, icon, color)
       VALUES ('acc', 'Main', 'checking', 'USD', '🏦', '#000000')`,
    );
    await db.runAsync(
      `INSERT INTO currency_rates (base, quote, rate, date) VALUES ('EUR', 'USD', 2, ?)`,
      [isoDateToUnix('2026-01-01')],
    );
    await db.runAsync(
      `INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date)
       VALUES ('rule', 'acc', 'expense', 1000, 'USD', 'daily', ?, ?)`,
      [today - 86400, today - 86400],
    );

    const result = await processDueScheduledTransactions(db as any, today);

    expect(result.createdTransactions).toBe(2);
    expect(fetchedInTransaction.length).toBeGreaterThan(0);
    expect(fetchedInTransaction).not.toContain(true);
    const rows = await db.getAllAsync<{ baseAmount: number }>(`SELECT baseAmount FROM transactions`);
    expect(rows.map((r) => r.baseAmount)).toEqual([500, 500]);
  });

  it('fetches the exact due-date rate when online', async () => {
    const db = await createTestDb();
    const today = isoDateToUnix('2026-03-10');
    fetchRatesForDate.mockResolvedValue({ rates: { USD: 4 }, source: 'test' });

    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency, icon, color)
       VALUES ('acc', 'Main', 'checking', 'USD', '🏦', '#000000')`,
    );
    for (const quote of CURRENCY_VALUES) {
      await db.runAsync(
        `INSERT INTO currency_rates (base, quote, rate, date) VALUES ('EUR', ?, 2, ?)`,
        [quote, today - 86400],
      );
    }
    await db.runAsync(
      `INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date)
       VALUES ('rule', 'acc', 'expense', 1000, 'USD', 'monthly', ?, ?)`,
      [today, today],
    );

    await processDueScheduledTransactions(db as any, today);

    expect(fetchRatesForDate).toHaveBeenCalledWith('2026-03-10', expect.anything());
    const rows = await db.getAllAsync<{ baseAmount: number }>(`SELECT baseAmount FROM transactions`);
    expect(rows.map((r) => r.baseAmount)).toEqual([250]);
  });

  it('skips a rule paused while rates were being fetched', async () => {
    const db = await createTestDb();
    const today = isoDateToUnix('2026-03-10');
    fetchRatesForDate.mockImplementation(async () => {
      db._raw.prepare(`UPDATE recurring_rules SET is_active = 0 WHERE id = 'rule'`).run();
      throw new Error('offline');
    });

    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency, icon, color)
       VALUES ('acc', 'Main', 'checking', 'USD', '🏦', '#000000')`,
    );
    await db.runAsync(
      `INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date)
       VALUES ('rule', 'acc', 'expense', 1000, 'USD', 'monthly', ?, ?)`,
      [today, today],
    );

    const result = await processDueScheduledTransactions(db as any, today);

    expect(result).toEqual({ createdTransactions: 0, updatedRules: 0 });
    const rule = await db.getFirstAsync<{ is_active: number }>(`SELECT is_active FROM recurring_rules`);
    expect(rule?.is_active).toBe(0);
  });
});

import { createTestDb } from '@/test-utils/sqlite-db';
import { recalculateAllBaseAmounts } from './recalculate';

jest.mock('./queries', () => ({
  getRatesForDates: jest.fn(async (_db: unknown, dates: number[]) => new Map(dates.map((d) => [d, { USD: 2 }]))),
}));

describe('recalculateAllBaseAmounts', () => {
  it('stores a positive baseAmount for out legs', async () => {
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR')`, []);
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date)
       VALUES ('t_out', 'acc_1', 'transfer', -5000, 'EUR', 5000, 'EUR', 1772323200), ('t_exp', 'acc_1', 'expense', 1000, 'EUR', 1000, 'EUR', 1772323200)`,
      [],
    );

    await recalculateAllBaseAmounts(db as any, 'USD');

    expect(await db.getAllAsync('SELECT id, amount, baseAmount, baseCurrency FROM transactions ORDER BY id')).toEqual([
      { id: 't_exp', amount: 1000, baseAmount: 2000, baseCurrency: 'USD' },
      { id: 't_out', amount: -5000, baseAmount: 10000, baseCurrency: 'USD' },
    ]);
  });
});

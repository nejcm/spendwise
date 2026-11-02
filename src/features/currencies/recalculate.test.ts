import { createTestDb } from '@/test-utils/sqlite-db';
import { getRatesForDates } from './queries';
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

  it('gives both legs of a cross-currency transfer the out leg baseAmount', async () => {
    jest.mocked(getRatesForDates).mockResolvedValueOnce(new Map([[1772323200, { GBP: 0.8 }]]));
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_eur', 'Euro', 'checking', 'EUR'), ('acc_gbp', 'Pound', 'checking', 'GBP')`, []);
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date, transfer_id)
       VALUES ('t_out', 'acc_eur', 'transfer', -10002, 'EUR', 0, 'USD', 1772323200, 'tr_1'), ('t_in', 'acc_gbp', 'transfer', 8002, 'GBP', 0, 'USD', 1772323200, 'tr_1')`,
      [],
    );

    await recalculateAllBaseAmounts(db as any, 'EUR');

    expect(await db.getAllAsync('SELECT id, baseAmount FROM transactions ORDER BY id')).toEqual([
      { id: 't_in', baseAmount: 10002 },
      { id: 't_out', baseAmount: 10002 },
    ]);
  });
});

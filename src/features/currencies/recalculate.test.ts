import { getAppState, setCurrency } from '@/lib/store/store';
import { createTestDb } from '@/test-utils/sqlite-db';
import { getRatesForDates } from './queries';
import { changePreferredCurrency } from './recalculate';

jest.mock('./queries', () => ({
  getRatesForDates: jest.fn(async (_db: unknown, dates: number[]) => new Map(dates.map((d) => [d, { USD: 2 }]))),
}));

describe('changePreferredCurrency', () => {
  it('stores a positive baseAmount for out legs', async () => {
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR')`, []);
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date)
       VALUES ('t_out', 'acc_1', 'transfer', -5000, 'EUR', 5000, 'EUR', 1772323200), ('t_exp', 'acc_1', 'expense', 1000, 'EUR', 1000, 'EUR', 1772323200)`,
      [],
    );

    await changePreferredCurrency(db as any, 'USD');

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

    await changePreferredCurrency(db as any, 'EUR');

    expect(await db.getAllAsync('SELECT id, baseAmount FROM transactions ORDER BY id')).toEqual([
      { id: 't_in', baseAmount: 10002 },
      { id: 't_out', baseAmount: 10002 },
    ]);
  });

  it('converts a row inserted after rates are fetched and before the write', async () => {
    setCurrency('EUR');
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR')`, []);
    await db.runAsync(`INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES ('t_old', 'acc_1', 'expense', 1000, 'EUR', 1000, 'EUR', 1772323200)`, []);
    jest.mocked(getRatesForDates).mockImplementationOnce(async (_db, dates) => {
      await db.runAsync(`INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES ('t_late', 'acc_1', 'expense', 300, 'EUR', 300, 'EUR', 1772409600)`, []);
      return new Map(dates.map((d) => [d, { USD: 2 }]));
    });

    await changePreferredCurrency(db as any, 'USD');

    expect(getRatesForDates).toHaveBeenLastCalledWith(db, expect.any(Array), { fetchIfMissing: false });
    expect(getAppState().currency).toBe('USD');
    expect(await db.getAllAsync('SELECT id, baseAmount, baseCurrency FROM transactions ORDER BY id')).toEqual([
      { id: 't_late', baseAmount: 600, baseCurrency: 'USD' },
      { id: 't_old', baseAmount: 2000, baseCurrency: 'USD' },
    ]);
  });

  it('leaves every row in the new Preferred Currency', async () => {
    setCurrency('EUR');
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR'), ('acc_2', 'Pound', 'checking', 'GBP')`, []);
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date)
       VALUES ('t1', 'acc_1', 'expense', 1000, 'EUR', 1000, 'EUR', 1772323200), ('t2', 'acc_2', 'income', 500, 'GBP', 600, 'EUR', 1700000000)`,
      [],
    );

    await changePreferredCurrency(db as any, 'USD');

    const preferred = getAppState().currency;
    expect(preferred).toBe('USD');
    expect(await db.getAllAsync('SELECT DISTINCT baseCurrency FROM transactions')).toEqual([{ baseCurrency: preferred }]);
  });

  it('restores the previous Preferred Currency when the write rolls back after setting it', async () => {
    setCurrency('EUR');
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR')`, []);
    await db.runAsync(`INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES ('t1', 'acc_1', 'expense', 1000, 'EUR', 1000, 'EUR', 1772323200)`, []);
    let setInsideWrite = '';
    const failingCommit = {
      ...db,
      async withTransactionAsync(cb: () => Promise<void>) {
        db._raw.exec('BEGIN');
        await cb();
        setInsideWrite = getAppState().currency;
        db._raw.exec('ROLLBACK');
        throw new Error('commit failed');
      },
    };

    await expect(changePreferredCurrency(failingCommit as any, 'USD')).rejects.toThrow('commit failed');

    expect(setInsideWrite).toBe('USD');
    expect(getAppState().currency).toBe('EUR');
    expect(await db.getAllAsync('SELECT DISTINCT baseCurrency FROM transactions')).toEqual([{ baseCurrency: 'EUR' }]);
  });
});

import { createTestDb } from '@/test-utils/sqlite-db';
import { withWriteTransaction } from './helpers';

describe('withWriteTransaction', () => {
  it('runs overlapping writes one after another, so a failing one rolls back only itself', async () => {
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_1', 'Checking', 'checking', 'EUR')`);
    const insert = (id: string) => db.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date) VALUES (?, 'acc_1', 'expense', 100, 'EUR', 100, 'EUR', 0)`,
      [id],
    );

    const failing = withWriteTransaction(db as any, async () => {
      await insert('t_failed');
      await Promise.resolve();
      throw new Error('write failed');
    });
    const succeeding = withWriteTransaction(db as any, async () => {
      await insert('t_kept');
    });

    await expect(failing).rejects.toThrow('write failed');
    await succeeding;
    expect(await db.getAllAsync('SELECT id FROM transactions')).toEqual([{ id: 't_kept' }]);
  });
});

import { createTestDb } from '@/test-utils/sqlite-db';
import { migrateDb } from './migrations';

async function createV5Db() {
  const db = await createTestDb();
  await db.execAsync(`
    DROP INDEX idx_transactions_transfer;
    ALTER TABLE transactions DROP COLUMN transfer_id;
    ALTER TABLE transactions DROP COLUMN is_adjustment;
    ALTER TABLE categories DROP COLUMN kind;
    PRAGMA user_version = 5;
  `);
  return db;
}

describe('migration 6', () => {
  it('adds transfer, adjustment and kind columns and backfills kind', async () => {
    const db = await createV5Db();
    await db.execAsync(`
      INSERT INTO accounts (id, name, type) VALUES ('acc', 'Checking', 'checking');
      INSERT INTO categories (id, name, color) VALUES
        ('cat_food', 'Food', '#f00'),
        ('cat_refunds', 'Refunds', '#f00'),
        ('cat_job', 'Job', '#0f0'),
        ('cat_salary', 'Salary', '#0f0'),
        ('cat_freelance', 'Freelance', '#0f0'),
        ('cat_rent_in', 'Rent in', '#0f0'),
        ('cat_empty', 'Empty', '#ccc'),
        ('_unknown', 'Unknown', '#333');
      INSERT INTO transactions (id, account_id, category_id, type, amount, baseAmount, date) VALUES
        ('t1', 'acc', 'cat_food', 'expense', 1000, 1000, 1),
        ('t2', 'acc', 'cat_food', 'income', 200, 200, 1),
        ('t3', 'acc', 'cat_refunds', 'income', 500, 500, 1),
        ('t4', 'acc', 'cat_refunds', 'expense', 500, 500, 1),
        ('t5', 'acc', 'cat_job', 'income', 300000, 300000, 1),
        ('t6', 'acc', 'cat_freelance', 'expense', 900, 900, 1),
        ('t7', 'acc', '_unknown', 'income', 9999, 9999, 1);
      INSERT INTO recurring_rules (id, account_id, category_id, type, amount, frequency, start_date, next_due_date) VALUES
        ('r1', 'acc', 'cat_rent_in', 'income', 80000, 'monthly', 1, 1);
    `);

    await migrateDb(db as any);

    expect(await db.getFirstAsync('PRAGMA user_version')).toEqual({ user_version: 6 });
    expect(await db.getAllAsync('SELECT id, kind FROM categories ORDER BY id')).toEqual([
      { id: '_unknown', kind: 'expense' },
      { id: 'cat_empty', kind: 'expense' },
      { id: 'cat_food', kind: 'expense' },
      { id: 'cat_freelance', kind: 'expense' },
      { id: 'cat_job', kind: 'income' },
      { id: 'cat_refunds', kind: 'expense' },
      { id: 'cat_rent_in', kind: 'income' },
      { id: 'cat_salary', kind: 'income' },
    ]);
    expect(await db.getFirstAsync('SELECT transfer_id, is_adjustment FROM transactions WHERE id = ?', ['t1']))
      .toEqual({ transfer_id: null, is_adjustment: 0 });
    expect(await db.getFirstAsync(`SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_transactions_transfer'`))
      .toEqual({ name: 'idx_transactions_transfer' });
  });

  it('rejects an unknown category kind', async () => {
    const db = await createTestDb();
    await expect(db.runAsync(`INSERT INTO categories (id, name, color, kind) VALUES ('c', 'C', '#000', 'transfer')`))
      // better-sqlite3 errors come from another realm under --runInBand, so toThrow's instanceof check fails
      .rejects
      .toHaveProperty('message', expect.stringMatching(/CHECK constraint failed/));
  });
});

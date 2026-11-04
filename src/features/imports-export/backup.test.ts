import { exportBackup, importBackup, validateBackup } from '@/features/imports-export/backup';
import { deleteTransaction, getTransactionById } from '@/features/transactions/queries';
import { createTestDb } from '@/test-utils/sqlite-db';

async function seedBase(db: Awaited<ReturnType<typeof createTestDb>>) {
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency) VALUES (?, ?, ?, ?)`,
    ['acc_1', 'Checking', 'checking', 'EUR'],
  );
  await db.runAsync(
    `INSERT INTO categories (id, name, color) VALUES (?, ?, ?)`,
    ['cat_1', 'Food', '#FF0000'],
  );
}

describe('backup metadata round-trip', () => {
  it('preserves transaction merchant and location fields across export/import', async () => {
    const sourceDb = await createTestDb();
    await seedBase(sourceDb);
    await sourceDb.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note, merchant_name, merchant_logo_slug, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['txn_1', 'acc_1', 'cat_1', 'expense', 5000, 'EUR', 5000, 'EUR', 1_772_323_200, 'Lunch', 'Cafe Roma', 'starbucks', 'Downtown branch, Berlin, DE'],
    );

    const backup = await exportBackup(sourceDb as any);
    expect(backup.transactions[0]?.merchant_name).toBe('Cafe Roma');
    expect(backup.transactions[0]?.merchant_logo_slug).toBe('starbucks');

    const restoredDb = await createTestDb();
    await importBackup(restoredDb as any, backup);

    const restored = await restoredDb.getFirstAsync<{
      merchant_name: string | null;
      merchant_logo_slug: string | null;
      location: string | null;
    }>(
      'SELECT merchant_name, merchant_logo_slug, location FROM transactions WHERE id = ?',
      ['txn_1'],
    );

    expect(restored).toEqual({
      merchant_name: 'Cafe Roma',
      merchant_logo_slug: 'starbucks',
      location: 'Downtown branch, Berlin, DE',
    });
  });
});

describe('backup v4', () => {
  it('round-trips transfer_id, is_adjustment and category kind', async () => {
    const sourceDb = await createTestDb();
    await seedBase(sourceDb);
    await sourceDb.runAsync(
      `INSERT INTO categories (id, name, color, kind) VALUES (?, ?, ?, ?)`,
      ['cat_pay', 'Pay', '#00FF00', 'income'],
    );
    await sourceDb.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, transfer_id, is_adjustment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['txn_out', 'acc_1', null, 'transfer', -5000, 'EUR', 5000, 'EUR', 1_772_323_200, 'tr_1', 0],
    );
    await sourceDb.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, is_adjustment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['txn_open', 'acc_1', null, 'transfer', 150000, 'EUR', 150000, 'EUR', 1_772_236_800, 1],
    );

    const backup = await exportBackup(sourceDb as any);
    expect(backup.version).toBe(5);

    const restoredDb = await createTestDb();
    await importBackup(restoredDb as any, backup);

    expect(await restoredDb.getAllAsync('SELECT id, transfer_id, is_adjustment FROM transactions ORDER BY id')).toEqual([
      { id: 'txn_open', transfer_id: null, is_adjustment: 1 },
      { id: 'txn_out', transfer_id: 'tr_1', is_adjustment: 0 },
    ]);
    expect(await restoredDb.getAllAsync('SELECT id, kind FROM categories ORDER BY id')).toEqual([
      { id: 'cat_1', kind: 'expense' },
      { id: 'cat_pay', kind: 'income' },
    ]);
  });

  it('restores a transfer pair that reads back as linked and deletes as one', async () => {
    const sourceDb = await createTestDb();
    await seedBase(sourceDb);
    await sourceDb.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc_2', 'Savings', 'savings', 'EUR')`, []);
    await sourceDb.runAsync(
      `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date, transfer_id)
       VALUES ('leg_out', 'acc_1', 'transfer', -5000, 'EUR', 5000, 'EUR', 1772323200, 'tr_1'),
              ('leg_in', 'acc_2', 'transfer', 5000, 'EUR', 5000, 'EUR', 1772323200, 'tr_1')`,
      [],
    );

    const restoredDb = await createTestDb();
    await importBackup(restoredDb as any, await exportBackup(sourceDb as any));

    expect(await getTransactionById(restoredDb as any, 'leg_in')).toMatchObject({ amount: 5000, counter_account_id: 'acc_1', counter_amount: -5000 });
    await deleteTransaction(restoredDb as any, 'leg_out');
    expect(await restoredDb.getAllAsync('SELECT id FROM transactions')).toEqual([]);
  });

  it('restores a v3 backup with defaults and backfills category kind', async () => {
    const v3 = {
      version: 3,
      exported_at: '2026-01-01T00:00:00.000Z',
      accounts: [{ id: 'acc_1', name: 'Checking', type: 'checking', currency: 'EUR', created_at: 1, updated_at: 1 }],
      categories: [
        { id: 'cat_food', name: 'Food', icon: null, color: '#f00', budget: null, sort_order: 0, created_at: 1 },
        { id: 'cat_job', name: 'Job', icon: null, color: '#0f0', budget: null, sort_order: 1, created_at: 1 },
        { id: 'cat_salary', name: 'Salary', icon: null, color: '#0f0', budget: null, sort_order: 2, created_at: 1 },
      ],
      transactions: [
        { id: 't1', account_id: 'acc_1', category_id: 'cat_food', type: 'expense', amount: 1200, currency: 'EUR', baseAmount: 1200, baseCurrency: 'EUR', date: 1_772_323_200, note: null, created_at: 1, updated_at: 1 },
        { id: 't2', account_id: 'acc_1', category_id: 'cat_job', type: 'income', amount: 300000, currency: 'EUR', baseAmount: 300000, baseCurrency: 'EUR', date: 1_772_323_200, note: null, created_at: 1, updated_at: 1 },
      ],
      recurring_rules: [],
      recurring_rule_runs: [],
    };

    const db = await createTestDb();
    await importBackup(db as any, v3 as any);

    expect(await db.getAllAsync('SELECT id, transfer_id, is_adjustment FROM transactions ORDER BY id')).toEqual([
      { id: 't1', transfer_id: null, is_adjustment: 0 },
      { id: 't2', transfer_id: null, is_adjustment: 0 },
    ]);
    expect(await db.getAllAsync('SELECT id, kind FROM categories ORDER BY id')).toEqual([
      { id: 'cat_food', kind: 'expense' },
      { id: 'cat_job', kind: 'income' },
      { id: 'cat_salary', kind: 'income' },
    ]);
  });

  it('leaves existing data intact when a restore fails mid-way', async () => {
    const db = await createTestDb();
    await seedBase(db);
    const raw = db._raw;
    const atomicDb = {
      ...db,
      async withTransactionAsync(cb: () => Promise<void>) {
        raw.exec('BEGIN');
        try {
          await cb();
          raw.exec('COMMIT');
        }
        catch (error) {
          raw.exec('ROLLBACK');
          throw error;
        }
      },
    };
    const backup = {
      version: 4,
      exported_at: '2026-01-01T00:00:00.000Z',
      accounts: [],
      categories: [{ id: 'cat_x', name: 'X', color: '#000', kind: 'bogus', created_at: 1 }],
      transactions: [{ id: 't1', account_id: 'missing_acc', type: 'expense', amount: 1, baseAmount: 1, baseCurrency: 'EUR', date: 1 }],
      recurring_rules: [],
      recurring_rule_runs: [],
    };

    await expect(importBackup(atomicDb as any, backup as any)).rejects.toHaveProperty('message', expect.stringMatching(/constraint failed/));

    expect(await db.getAllAsync('SELECT id FROM accounts')).toEqual([{ id: 'acc_1' }]);
    expect(await db.getAllAsync('SELECT id FROM categories')).toEqual([{ id: 'cat_1' }]);
  });

  it('normalizes an unknown category kind to expense', async () => {
    const db = await createTestDb();
    await importBackup(db as any, {
      version: 4,
      exported_at: '2026-01-01T00:00:00.000Z',
      accounts: [],
      categories: [{ id: 'cat_x', name: 'X', color: '#000', kind: 'bogus', created_at: 1 }],
      transactions: [],
      recurring_rules: [],
      recurring_rule_runs: [],
    } as any);
    expect(await db.getAllAsync('SELECT id, kind FROM categories')).toEqual([{ id: 'cat_x', kind: 'expense' }]);
  });
});

describe('backup v5', () => {
  const v4 = {
    version: 4,
    exported_at: '2026-01-01T00:00:00.000Z',
    accounts: [{ id: 'acc_1', name: 'Checking', type: 'checking', currency: 'EUR', created_at: 1, updated_at: 1 }],
    categories: [],
    transactions: [{ id: 't1', account_id: 'acc_1', category_id: null, type: 'expense', amount: 100, currency: 'EUR', baseAmount: 100, baseCurrency: 'EUR', date: 1, note: null, created_at: 1, updated_at: 1 }],
    recurring_rules: [],
    recurring_rule_runs: [],
  };
  const v5 = { ...v4, version: 5, transaction_tags: [{ transaction_id: 't1', tag: 'Lisbon' }] };

  it('round-trips transaction tags', async () => {
    const sourceDb = await createTestDb();
    await seedBase(sourceDb);
    await sourceDb.execAsync(`
      INSERT INTO transactions (id, account_id, type, amount, baseAmount, date) VALUES ('t1', 'acc_1', 'expense', 100, 100, 1);
      INSERT INTO transaction_tags (transaction_id, tag) VALUES ('t1', 'Lisbon'), ('t1', 'Travel, work');
    `);

    const backup = validateBackup(JSON.parse(JSON.stringify(await exportBackup(sourceDb as any))));
    expect(backup.version).toBe(5);
    const restoredDb = await createTestDb();
    await importBackup(restoredDb as any, backup);

    expect((await getTransactionById(restoredDb as any, 't1'))!.tags).toEqual(['Lisbon', 'Travel, work']);
  });

  it('restores a v4 backup without tags', async () => {
    const db = await createTestDb();
    await importBackup(db as any, validateBackup(v4));

    expect(await db.getAllAsync('SELECT id FROM transactions')).toEqual([{ id: 't1' }]);
    expect(await db.getAllAsync('SELECT * FROM transaction_tags')).toEqual([]);
  });

  it('rejects unsupported versions, a v5 backup without tags and malformed tag rows', () => {
    expect(validateBackup(v5).transaction_tags).toEqual([{ transaction_id: 't1', tag: 'Lisbon' }]);
    for (const version of [999, 'future', -1, 0, 4.5]) {
      expect(() => validateBackup({ ...v5, version })).toThrow('invalid');
    }
    expect(() => validateBackup({ ...v5, transaction_tags: undefined })).toThrow('invalid');
    expect(() => validateBackup({ ...v5, transaction_tags: [{ transaction_id: 't1', tag: 1 }] })).toThrow('invalid');
    expect(() => validateBackup({ ...v5, transaction_tags: [null] })).toThrow('invalid');
    expect(() => validateBackup({ ...v4, transaction_tags: 'Lisbon' })).toThrow('invalid');
  });

  it('rolls back and keeps prior data when a tag points at a missing transaction', async () => {
    const db = await createTestDb();
    await seedBase(db);
    const orphan = { ...v5, transaction_tags: [{ transaction_id: 'missing', tag: 'Lisbon' }] };

    await expect(importBackup(db as any, validateBackup(orphan))).rejects.toHaveProperty('message', expect.stringMatching(/FOREIGN KEY constraint failed/));

    expect(await db.getAllAsync('SELECT id FROM accounts')).toEqual([{ id: 'acc_1' }]);
    expect(await db.getAllAsync('SELECT id FROM transactions')).toEqual([]);
  });
});

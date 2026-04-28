import { exportBackup, importBackup } from '@/features/imports-export/backup';
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
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note, merchant_name, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['txn_1', 'acc_1', 'cat_1', 'expense', 5000, 'EUR', 5000, 'EUR', 1_772_323_200, 'Lunch', 'Cafe Roma', 'Downtown branch, Berlin, DE'],
    );

    const backup = await exportBackup(sourceDb as any);
    expect(backup.transactions[0]?.merchant_name).toBe('Cafe Roma');

    const restoredDb = await createTestDb();
    await importBackup(restoredDb as any, backup);

    const restored = await restoredDb.getFirstAsync<{
      merchant_name: string | null;
      location: string | null;
    }>(
      'SELECT merchant_name, location FROM transactions WHERE id = ?',
      ['txn_1'],
    );

    expect(restored).toEqual({
      merchant_name: 'Cafe Roma',
      location: 'Downtown branch, Berlin, DE',
    });
  });

  it('preserves tags and transaction_tags across export/import', async () => {
    const sourceDb = await createTestDb();
    await seedBase(sourceDb);
    await sourceDb.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['txn_1', 'acc_1', 'cat_1', 'expense', 5000, 'EUR', 5000, 'EUR', 1_772_323_200],
    );
    await sourceDb.runAsync(
      `INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
      ['tag_1', 'Business', '#0000ff'],
    );
    await sourceDb.runAsync(
      `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
      ['txn_1', 'tag_1'],
    );

    const backup = await exportBackup(sourceDb as any);
    expect(backup.tags).toHaveLength(1);
    expect(backup.transaction_tags).toHaveLength(1);

    const restoredDb = await createTestDb();
    await importBackup(restoredDb as any, backup);

    const restoredTag = await restoredDb.getFirstAsync<{ name: string; color: string }>(
      'SELECT name, color FROM tags WHERE id = ?',
      ['tag_1'],
    );
    expect(restoredTag).toEqual({ name: 'Business', color: '#0000ff' });

    const restoredLink = await restoredDb.getFirstAsync<{ transaction_id: string; tag_id: string }>(
      'SELECT transaction_id, tag_id FROM transaction_tags WHERE transaction_id = ?',
      ['txn_1'],
    );
    expect(restoredLink).toEqual({ transaction_id: 'txn_1', tag_id: 'tag_1' });
  });

  it('validateBackup throws version_too_new for future backup versions', () => {
    const { validateBackup } = require('@/features/imports-export/backup');
    expect(() =>
      validateBackup({
        version: 9999,
        accounts: [],
        categories: [],
        transactions: [],
        recurring_rules: [],
        recurring_rule_runs: [],
      }),
    ).toThrow('version_too_new');
  });
});

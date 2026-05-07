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

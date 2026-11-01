import type { TestDb } from '@/test-utils/sqlite-db';
import { createTestDb } from '@/test-utils/sqlite-db';
import { deleteData, getDataCounts } from './queries';

async function seed(db: TestDb) {
  await db.execAsync(`
    INSERT INTO accounts (id, name, type, currency, is_archived, sort_order) VALUES
      ('acc', 'Checking', 'checking', 'EUR', 0, 0),
      ('acc_old', 'Old', 'savings', 'EUR', 1, 1);
    INSERT INTO categories (id, name, icon, color, sort_order) VALUES
      ('cat_food', 'Food', NULL, '#000000', 0),
      ('_unknown', 'Unknown', '?', '#333333', 11);
    INSERT INTO recurring_rules (id, account_id, type, amount, currency, frequency, start_date, next_due_date, is_active) VALUES
      ('rule_on', 'acc', 'expense', 1000, 'EUR', 'monthly', 100, 200, 1),
      ('rule_off', 'acc', 'expense', 1000, 'EUR', 'monthly', 100, 200, 0);
    INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, transfer_id) VALUES
      ('t1', 'acc', 'cat_food', 'expense', -500, 'EUR', -500, 'EUR', 100, NULL),
      ('out', 'acc', NULL, 'transfer', -200, 'EUR', -200, 'EUR', 100, 'tr_1'),
      ('in', 'acc_old', NULL, 'transfer', 200, 'EUR', 200, 'EUR', 100, 'tr_1');
  `);
}

describe('settings data queries', () => {
  it('counts a transfer pair once and leaves out Uncategorised', async () => {
    const db = await createTestDb();
    await seed(db);
    expect(await getDataCounts(db as any)).toEqual({
      transactions: 2,
      rules: 2,
      activeRules: 1,
      categories: 1,
      accounts: 2,
      openAccounts: 1,
    });
  });

  it('always deletes transactions and rules, keeps unpicked categories and accounts', async () => {
    const db = await createTestDb();
    await seed(db);
    await deleteData(db as any, { categories: false, accounts: false });
    expect(await getDataCounts(db as any)).toMatchObject({ transactions: 0, rules: 0, categories: 1, accounts: 2 });
  });

  it('deletes picked categories and accounts', async () => {
    const db = await createTestDb();
    await seed(db);
    await deleteData(db as any, { categories: true, accounts: true });
    expect(await getDataCounts(db as any)).toMatchObject({ transactions: 0, rules: 0, categories: 0, accounts: 0 });
  });
});

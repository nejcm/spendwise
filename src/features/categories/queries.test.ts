import { DEFAULT_CATEGORY_ID } from '@/config';
import { createTestDb } from '@/test-utils/sqlite-db';

import { createCategory, deleteCategory, getCategories, getCategoryMonthlyTotals, getCategoryUsage, updateCategory } from './queries';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'cat-uuid'),
}));

describe('category kind', () => {
  it('stores the kind on insert and update', async () => {
    const db = await createTestDb();
    await createCategory(db as any, { name: 'Salary', icon: null, color: '#00FF00', kind: 'income' });
    expect(await getCategories(db as any)).toMatchObject([{ id: 'cat-uuid', kind: 'income' }]);

    await updateCategory(db as any, 'cat-uuid', { name: 'Salary', icon: null, color: '#00FF00', kind: 'expense' });
    expect(await getCategories(db as any)).toMatchObject([{ id: 'cat-uuid', kind: 'expense' }]);
  });

  it('rejects an unknown kind', async () => {
    const db = await createTestDb();
    await expect(createCategory(db as any, { name: 'X', icon: null, color: '#000', kind: 'transfer' as any }))
      .rejects
      .toHaveProperty('message', expect.stringMatching(/CHECK constraint failed/));
  });
});

describe('category delete', () => {
  const OCT_1 = Date.UTC(2026, 9, 1) / 1000;
  const NOV_1 = Date.UTC(2026, 10, 1) / 1000;

  async function seed() {
    const db = await createTestDb();
    await db.runAsync(`INSERT INTO accounts (id, name, type, currency) VALUES ('acc', 'Main', 'checking', 'EUR')`);
    await db.runAsync(`INSERT INTO categories (id, name, color, kind, budget) VALUES
      ('eat', 'Eating out', '#f07a5a', 'expense', 20000), ('go', 'Going out', '#5aa8b5', 'expense', NULL)`);
    await db.runAsync(`INSERT INTO transactions (id, account_id, category_id, type, amount, baseAmount, date, updated_at) VALUES
      ('t1', 'acc', 'eat', 'expense', 1850, 1850, ?, 100), ('t2', 'acc', 'eat', 'expense', 3380, 3380, ?, 100), ('t3', 'acc', 'go', 'expense', 500, 500, ?, 100)`, [OCT_1, OCT_1 - 86400, OCT_1]);
    await db.runAsync(`INSERT INTO recurring_rules (id, account_id, category_id, type, amount, frequency, start_date, next_due_date) VALUES
      ('r1', 'acc', 'eat', 'expense', 1000, 'monthly', ?, ?)`, [OCT_1, NOV_1]);
    return db;
  }

  const categoryOf = async (db: Awaited<ReturnType<typeof seed>>, table: string, id: string) =>
    (await db.getFirstAsync<{ category_id: string }>(`SELECT category_id FROM ${table} WHERE id = ?`, [id]))?.category_id;

  it('counts transactions and recurring rules using a category', async () => {
    const db = await seed();
    expect(await getCategoryUsage(db as any, 'eat')).toEqual({ transactions: 2, rules: 1 });
    expect(await getCategoryUsage(db as any, 'go')).toEqual({ transactions: 1, rules: 0 });
  });

  it('moves transactions and rules to the target, then deletes, without touching updated_at', async () => {
    const db = await seed();
    await deleteCategory(db as any, 'eat', 'go');
    expect(await categoryOf(db, 'transactions', 't1')).toBe('go');
    expect(await categoryOf(db, 'transactions', 't2')).toBe('go');
    expect(await categoryOf(db, 'recurring_rules', 'r1')).toBe('go');
    expect((await getCategories(db as any)).map((c) => c.id)).toEqual(['go']);
    expect(await db.getFirstAsync('SELECT updated_at FROM transactions WHERE id = ?', ['t1'])).toEqual({ updated_at: 100 });
  });

  it('recreates Uncategorised when it is the target', async () => {
    const db = await seed();
    await deleteCategory(db as any, 'eat', DEFAULT_CATEGORY_ID);
    expect(await categoryOf(db, 'transactions', 't1')).toBe(DEFAULT_CATEGORY_ID);
    expect(await categoryOf(db, 'recurring_rules', 'r1')).toBe(DEFAULT_CATEGORY_ID);
    expect((await getCategories(db as any)).map((c) => c.id).sort()).toEqual([DEFAULT_CATEGORY_ID, 'go']);
  });

  it('deletes an unused category without a target', async () => {
    const db = await seed();
    await db.runAsync(`INSERT INTO categories (id, name, color) VALUES ('empty', 'Empty', '#000')`);
    await deleteCategory(db as any, 'empty');
    expect((await getCategories(db as any)).map((c) => c.id)).not.toContain('empty');
  });

  it('refuses to delete a used category without a target', async () => {
    const db = await seed();
    await expect(deleteCategory(db as any, 'eat')).rejects.toThrow(/FOREIGN KEY/);
  });

  it('refuses to delete Uncategorised or move a category onto itself', async () => {
    const db = await seed();
    await expect(deleteCategory(db as any, DEFAULT_CATEGORY_ID, 'go')).rejects.toThrow('invalid_category_delete');
    await expect(deleteCategory(db as any, 'eat', 'eat')).rejects.toThrow('invalid_category_delete');
    expect(await categoryOf(db, 'transactions', 't1')).toBe('eat');
  });

  it('sums a category per calendar month', async () => {
    const db = await seed();
    expect(await getCategoryMonthlyTotals(db as any, 'eat', OCT_1 - 31 * 86400, NOV_1)).toEqual([
      { month: '2026-09', income: 0, expense: 3380 },
      { month: '2026-10', income: 0, expense: 1850 },
    ]);
  });
});

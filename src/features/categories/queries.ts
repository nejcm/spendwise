import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category, CategoryFormData, CategoryUsage } from './types';
import type { MonthlyTotals } from '@/features/insights/types';

import { DEFAULT_CATEGORY_ID } from '@/config';
import { amountToCents } from '@/features/formatting/helpers';
import { generateId, withWriteTransaction } from '@/lib/sqlite';

export async function getCategories(db: SQLiteDatabase): Promise<Category[]> {
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY sort_order ASC');
}

export async function createCategory(
  db: SQLiteDatabase,
  data: CategoryFormData,
): Promise<string> {
  const id = generateId();
  const budgetCents = data.budget?.trim() ? amountToCents(Number(data.budget)) : null;
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, kind, budget, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, data.name.trim(), data.icon?.trim() || null, data.color, data.kind, budgetCents, data.sort_order ?? 999999],
  );
  return id;
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  data: CategoryFormData,
): Promise<void> {
  const budgetCents = data.budget?.trim() ? amountToCents(Number(data.budget)) : null;
  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, kind = ?, budget = ? WHERE id = ?',
    [data.name.trim(), data.icon?.trim() || null, data.color, data.kind, budgetCents, id],
  );
}

export async function getCategoryUsage(db: SQLiteDatabase, id: string): Promise<CategoryUsage> {
  const row = await db.getFirstAsync<CategoryUsage>(
    `SELECT
       (SELECT COUNT(*) FROM transactions WHERE category_id = ?) as transactions,
       (SELECT COUNT(*) FROM recurring_rules WHERE category_id = ?) as rules`,
    [id, id],
  );
  return row ?? { transactions: 0, rules: 0 };
}

/** Moves the category's transactions and recurring rules to `targetId`, then deletes it. Without a target, a used category fails on its foreign keys. */
export async function deleteCategory(
  db: SQLiteDatabase,
  id: string,
  targetId?: string,
): Promise<void> {
  if (id === DEFAULT_CATEGORY_ID || targetId === id) throw new Error('invalid_category_delete');
  await withWriteTransaction(db, async () => {
    if (targetId) {
      if (targetId === DEFAULT_CATEGORY_ID) {
        await db.runAsync(`INSERT OR IGNORE INTO categories (id, name, icon, color, sort_order) VALUES (?, 'Unknown', '?', '#333333', 11)`, [DEFAULT_CATEGORY_ID]);
      }
      await db.runAsync('UPDATE transactions SET category_id = ? WHERE category_id = ?', [targetId, id]);
      await db.runAsync('UPDATE recurring_rules SET category_id = ? WHERE category_id = ?', [targetId, id]);
    }
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  });
}

export async function getCategoryMonthlyTotals(
  db: SQLiteDatabase,
  categoryId: string,
  startDate: number,
  endDate: number,
): Promise<MonthlyTotals[]> {
  return db.getAllAsync<MonthlyTotals>(
    `SELECT
       strftime('%Y-%m', date, 'unixepoch') as month,
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE category_id = ? AND date >= ? AND date < ?
     GROUP BY month
     ORDER BY month ASC`,
    [categoryId, startDate, endDate],
  );
}

export async function updateCategoryOrder(
  db: SQLiteDatabase,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await withWriteTransaction(db, async () => {
    for (const item of items) {
      await db.runAsync('UPDATE categories SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
  });
}

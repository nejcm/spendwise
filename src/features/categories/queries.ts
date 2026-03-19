import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category, CategoryFormData } from './types';

import { amountToCents } from '@/features/formatting/helpers';
import { generateId } from '@/lib/sqlite';

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
    'INSERT INTO categories (id, name, icon, color, budget, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.name.trim(), data.icon?.trim() || null, data.color, budgetCents, data.sort_order ?? 999999],
  );
  return id;
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  data: Pick<CategoryFormData, 'name' | 'icon' | 'color' | 'budget' | 'sort_order'>,
): Promise<void> {
  const budgetCents = data.budget?.trim() ? amountToCents(Number(data.budget)) : null;
  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, budget = ? WHERE id = ?',
    [data.name.trim(), data.icon?.trim() || null, data.color, budgetCents, id],
  );
}

export async function deleteCategory(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function updateCategoryOrder(
  db: SQLiteDatabase,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync('UPDATE categories SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
  });
}

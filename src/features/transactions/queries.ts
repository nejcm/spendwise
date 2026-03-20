import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary, TransactionFormData, TransactionWithCategory } from './types';

import { getCurrentMonthRange } from '@/lib/date/helpers';
import { generateId } from '@/lib/sqlite';

// ─── Read Queries ───

export async function getTransactions(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
): Promise<TransactionWithCategory[]> {
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.date >= ? AND t.date < ?
     ORDER BY t.date DESC, t.created_at DESC`,
    [startDate, endDate],
  );
}

export async function getTransactionById(
  db: SQLiteDatabase,
  id: string,
): Promise<TransactionWithCategory | null> {
  return db.getFirstAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id],
  );
}

export async function getRecentTransactions(
  db: SQLiteDatabase,
  limit: number,
): Promise<TransactionWithCategory[]> {
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT ?`,
    [limit],
  );
}

export async function getMonthSummary(
  db: SQLiteDatabase,
  yearMonth: string,
): Promise<MonthSummary> {
  const [startDate, endDate] = getCurrentMonthRange(yearMonth);

  const result = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense
     FROM transactions
     WHERE date >= ? AND date < ?`,
    [startDate, endDate],
  );

  const income = result?.income ?? 0;
  const expense = result?.expense ?? 0;
  return { income, expense, balance: income - expense };
}

// ─── Write Queries ───

export async function createTransaction(
  db: SQLiteDatabase,
  data: TransactionFormData,
): Promise<string> {
  const id = generateId();

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.account_id, data.category_id, data.type, data.amount, data.currency, data.baseAmount, data.baseCurrency, data.date, data.note || null],
  );

  return id;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  data: TransactionFormData,
): Promise<void> {
  await db.runAsync(
    `UPDATE transactions
     SET account_id = ?, category_id = ?, type = ?, amount = ?, currency = ?, baseAmount = ?, baseCurrency = ?, date = ?, note = ?, updated_at = strftime('%s','now')
     WHERE id = ?`,
    [data.account_id, data.category_id, data.type, data.amount, data.currency, data.baseAmount, data.baseCurrency, data.date, data.note || null, id],
  );
}

export async function deleteTransaction(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

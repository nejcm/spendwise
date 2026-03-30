import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary, TransactionInsertData, TransactionWithCategory } from './types';

import { getCurrentMonthRange } from '@/lib/date/helpers';
import { generateId } from '@/lib/sqlite';

// ─── Read Queries ───

export async function getTransactions(
  db: SQLiteDatabase,
  startDate: number | undefined,
  endDate: number | undefined,
): Promise<TransactionWithCategory[]> {
  const hasRange = !!startDate && !!endDate;
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ${hasRange ? 'WHERE t.date >= ? AND t.date < ?' : ''}
     ORDER BY t.date DESC, t.created_at DESC`,
    hasRange ? [startDate, endDate] : [],
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

export async function getTransactionsSample(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
  limit: number,
): Promise<TransactionWithCategory[]> {
  return db.getAllAsync<TransactionWithCategory>(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.date >= ? AND t.date < ?
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT ?`,
    [startDate, endDate, limit],
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

/** SQLite SQLITE_MAX_VARIABLE_NUMBER is often 999; stay safely under for multi-row INSERTs. */
const MAX_TRANSACTION_ROWS_PER_BATCH = 50;

function buildTransactionsBatchInsert(
  chunk: TransactionInsertData[],
  ids: string[],
): { sql: string; params: (string | number | null)[] } {
  const rowPlaceholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const sql = `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
    VALUES ${rowPlaceholders}`;
  const params: (string | number | null)[] = [];
  for (let i = 0; i < chunk.length; i++) {
    const data = chunk[i]!;
    const id = ids[i]!;
    params.push(
      id,
      data.account_id,
      data.category_id,
      data.type,
      data.amount,
      data.currency,
      data.baseAmount,
      data.baseCurrency,
      data.date,
      data.note || null,
    );
  }
  return { sql, params };
}

export async function createTransaction(
  db: SQLiteDatabase,
  data: TransactionInsertData,
): Promise<string> {
  const id = generateId();

  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.account_id, data.category_id, data.type, data.amount, data.currency, data.baseAmount, data.baseCurrency, data.date, data.note || null],
  );

  return id;
}

/**
 * Batch insert using multi-row INSERT statements (chunked to respect SQLite bind limits).
 */
export async function createTransactions(
  db: SQLiteDatabase,
  dataList: TransactionInsertData[],
): Promise<string[]> {
  if (dataList.length === 0) {
    return [];
  }
  const allIds: string[] = [];
  await db.withTransactionAsync(async () => {
    for (let offset = 0; offset < dataList.length; offset += MAX_TRANSACTION_ROWS_PER_BATCH) {
      const chunk = dataList.slice(offset, offset + MAX_TRANSACTION_ROWS_PER_BATCH);
      const ids = chunk.map(() => generateId());
      const { sql, params } = buildTransactionsBatchInsert(chunk, ids);
      await db.runAsync(sql, params);
      allIds.push(...ids);
    }
  });
  return allIds;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  data: TransactionInsertData,
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

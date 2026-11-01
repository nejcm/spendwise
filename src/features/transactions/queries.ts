import type { SQLiteDatabase } from 'expo-sqlite';

import type { MonthSummary, TransactionInsertData, TransactionWithCategory, TransferInsertData } from './types';
import type { CurrencyKey } from '@/features/currencies';
import type { RatesMap } from '@/features/currencies/queries';

import { convertAmount } from '@/features/currencies/queries';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { generateId } from '@/lib/sqlite';

// ─── Read Queries ───

const TRANSACTION_SELECT = `SELECT t.*, a.name as account_name, c.name as category_name, c.icon as category_icon, c.color as category_color,
       tp.account_id as counter_account_id, ca.name as counter_account_name, ca.icon as counter_account_icon,
       tp.amount as counter_amount, tp.currency as counter_currency
     FROM transactions t
     LEFT JOIN accounts a ON a.id = t.account_id
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN transactions tp ON t.transfer_id IS NOT NULL AND tp.transfer_id = t.transfer_id AND tp.id <> t.id
     LEFT JOIN accounts ca ON ca.id = tp.account_id`;

const HIDE_TRANSFER_IN_LEG = '(t.transfer_id IS NULL OR t.amount < 0)';

/** All-accounts lists show a transfer pair once, as its out leg. */
export function isTransferInLeg(t: Pick<TransactionWithCategory, 'transfer_id' | 'amount'>): boolean {
  return !!t.transfer_id && t.amount > 0;
}

export async function getTransactions(
  db: SQLiteDatabase,
  startDate: number | undefined,
  endDate: number | undefined,
): Promise<TransactionWithCategory[]> {
  const hasRange = !!startDate && !!endDate;
  return db.getAllAsync<TransactionWithCategory>(
    `${TRANSACTION_SELECT}
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
    `${TRANSACTION_SELECT}
     WHERE t.id = ?`,
    [id],
  );
}

export async function hasTransactions(db: SQLiteDatabase): Promise<boolean> {
  return (await db.getFirstAsync('SELECT 1 FROM transactions LIMIT 1')) !== null;
}

export async function hasUserTransactions(db: SQLiteDatabase): Promise<boolean> {
  return (await db.getFirstAsync('SELECT 1 FROM transactions WHERE is_adjustment = 0 LIMIT 1')) !== null;
}

export async function getRecentTransactions(
  db: SQLiteDatabase,
  limit: number,
): Promise<TransactionWithCategory[]> {
  return db.getAllAsync<TransactionWithCategory>(
    `${TRANSACTION_SELECT}
     WHERE ${HIDE_TRANSFER_IN_LEG}
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
    `${TRANSACTION_SELECT}
     WHERE t.date >= ? AND t.date < ? AND ${HIDE_TRANSFER_IN_LEG}
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
  const rowPlaceholders = chunk.map(() => `(${INSERT_COLUMNS.map(() => '?').join(', ')})`).join(', ');
  const sql = `INSERT INTO transactions (${INSERT_COLUMNS.join(', ')}) VALUES ${rowPlaceholders}`;
  const params = chunk.flatMap((data, i) => insertParams(ids[i]!, data));
  return { sql, params };
}

const INSERT_COLUMNS = ['id', 'account_id', 'category_id', 'type', 'amount', 'currency', 'baseAmount', 'baseCurrency', 'date', 'note', 'merchant_name', 'merchant_logo_slug', 'location', 'transfer_id', 'is_adjustment'];

function insertParams(id: string, data: TransactionInsertData): (string | number | null)[] {
  return [id, data.account_id, data.category_id || null, data.type, data.amount, data.currency, data.baseAmount, data.baseCurrency, data.date, data.note || null, data.merchant_name, data.merchant_logo_slug, data.location, data.transfer_id ?? null, data.is_adjustment ?? 0];
}

export async function createTransaction(
  db: SQLiteDatabase,
  data: TransactionInsertData,
): Promise<string> {
  const id = generateId();
  await createTransactionRow(db, id, data);
  return id;
}

export const TRANSFER_LEG_ROUNDS_TO_ZERO = 'transfer_leg_rounds_to_zero';

/** Out leg is negative and in leg positive, each in its own account's currency; both share the positive `baseAmount`. */
async function buildTransferLegs(
  db: SQLiteDatabase,
  data: TransferInsertData,
  rates: RatesMap,
  transferId: string,
): Promise<[outLeg: TransactionInsertData, inLeg: TransactionInsertData]> {
  if (data.account_id === data.to_account_id) throw new Error('Transfer accounts must differ');
  if (data.amount <= 0) throw new Error('Transfer amount must be positive');
  const rows = await db.getAllAsync<{ id: string; currency: CurrencyKey }>(
    'SELECT id, currency FROM accounts WHERE id IN (?, ?)',
    [data.account_id, data.to_account_id],
  );
  const currencyOf = (accountId: string) => rows.find((r) => r.id === accountId)?.currency ?? data.currency;
  const { to_account_id, ...common } = data;
  const leg = (accountId: string, sign: 1 | -1): TransactionInsertData => {
    const currency = currencyOf(accountId);
    const amount = convertAmount(data.amount, data.currency, currency, rates);
    // Legs are told apart by sign, so a zero leg would be orphaned by update and duplicate.
    if (amount === 0) throw new Error(TRANSFER_LEG_ROUNDS_TO_ZERO);
    return {
      ...common,
      type: 'transfer',
      category_id: null,
      account_id: accountId,
      currency,
      amount: sign * amount,
      baseAmount: Math.abs(data.baseAmount),
      transfer_id: transferId,
      is_adjustment: 0,
    };
  };
  return [leg(data.account_id, -1), leg(to_account_id, 1)];
}

/** Returns the out leg's id. */
export async function createTransfer(
  db: SQLiteDatabase,
  data: TransferInsertData,
  rates: RatesMap,
): Promise<string> {
  const [outLeg, inLeg] = await buildTransferLegs(db, data, rates, generateId());
  const outId = generateId();
  await db.withTransactionAsync(async () => {
    await createTransactionRow(db, outId, outLeg);
    await createTransactionRow(db, generateId(), inLeg);
  });
  return outId;
}

async function createTransactionRow(db: SQLiteDatabase, id: string, data: TransactionInsertData) {
  await db.runAsync(
    `INSERT INTO transactions (${INSERT_COLUMNS.join(', ')}) VALUES (${INSERT_COLUMNS.map(() => '?').join(', ')})`,
    insertParams(id, data),
  );
}

export async function updateTransfer(
  db: SQLiteDatabase,
  transferId: string,
  data: TransferInsertData,
  rates: RatesMap,
): Promise<void> {
  const legs = await buildTransferLegs(db, data, rates, transferId);
  await db.withTransactionAsync(async () => {
    for (const [leg, side] of [[legs[0], 'amount < 0'], [legs[1], 'amount > 0']] as const) {
      await db.runAsync(
        `UPDATE transactions
         SET account_id = ?, category_id = ?, amount = ?, currency = ?, baseAmount = ?, baseCurrency = ?, date = ?, note = ?, merchant_name = ?, merchant_logo_slug = ?, location = ?, updated_at = strftime('%s','now')
         WHERE transfer_id = ? AND ${side}`,
        [leg.account_id, leg.category_id || null, leg.amount, leg.currency, leg.baseAmount, leg.baseCurrency, leg.date, leg.note || null, leg.merchant_name, leg.merchant_logo_slug, leg.location, transferId],
      );
    }
  });
}

/** Copies both legs under a new `transfer_id`; returns the new out leg's id. */
export async function duplicateTransfer(
  db: SQLiteDatabase,
  transferId: string,
): Promise<string> {
  const newTransferId = generateId();
  const outId = generateId();
  const copied = INSERT_COLUMNS.slice(1, -2).join(', ');
  await db.withTransactionAsync(async () => {
    for (const [id, side] of [[outId, 'amount < 0'], [generateId(), 'amount > 0']] as const) {
      await db.runAsync(
        `INSERT INTO transactions (id, ${copied}, transfer_id, is_adjustment)
         SELECT ?, ${copied}, ?, 0 FROM transactions WHERE transfer_id = ? AND ${side}`,
        [id, newTransferId, transferId],
      );
    }
  });
  return outId;
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
     SET account_id = ?, category_id = ?, type = ?, amount = ?, currency = ?, baseAmount = ?, baseCurrency = ?, date = ?, note = ?, merchant_name = ?, merchant_logo_slug = ?, location = ?, updated_at = strftime('%s','now')
     WHERE id = ?`,
    [data.account_id, data.category_id || null, data.type, data.amount, data.currency, data.baseAmount, data.baseCurrency, data.date, data.note || null, data.merchant_name, data.merchant_logo_slug, data.location, id],
  );
}

export async function deleteTransaction(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await deleteTransactions(db, [id]);
}

export async function deleteTransactions(
  db: SQLiteDatabase,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;

  // Keep well below SQLite's usual 999 bind-variable limit.
  const chunkSize = 400;
  await db.withTransactionAsync(async () => {
    for (let offset = 0; offset < ids.length; offset += chunkSize) {
      const chunk = ids.slice(offset, offset + chunkSize);
      const placeholders = chunk.map(() => '?').join(', ');
      await db.runAsync(
        `DELETE FROM transactions WHERE id IN (${placeholders})
         OR transfer_id IN (SELECT transfer_id FROM transactions WHERE id IN (${placeholders}) AND transfer_id IS NOT NULL)`,
        [...chunk, ...chunk],
      );
    }
  });
}

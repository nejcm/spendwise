import type { SQLiteDatabase } from 'expo-sqlite';

import type { Account, AccountFormData, AccountWithBalance } from './types';

import { parseToCents } from '@/lib/data/money';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { generateId } from '@/lib/sqlite';

// ─── Read Queries ───

export async function getAccounts(db: SQLiteDatabase): Promise<Account[]> {
  return db.getAllAsync<Account>(
    'SELECT * FROM accounts WHERE is_archived = 0 ORDER BY sort_order ASC',
  );
}

export async function getAccountsWithBalance(
  db: SQLiteDatabase,
): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)
       as balance,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN t.baseAmount ELSE 0 END), 0)
       as baseBalance,
       t.baseCurrency as baseCurrency
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
  );
}

export async function getAccountsWithBalanceForMonth(
  db: SQLiteDatabase,
  yearMonth: string,
): Promise<AccountWithBalance[]> {
  const [startDate, endDate] = getCurrentMonthRange(yearMonth); // returns [number, number]

  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)
       as balance,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN t.baseAmount ELSE 0 END), 0)
       as baseBalance,
       t.baseCurrency as baseCurrency
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
       AND t.date >= ? AND t.date < ?
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
    [startDate, endDate],
  );
}

export async function getAccountsWithBalanceForRange(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
): Promise<AccountWithBalance[]> {
  return db.getAllAsync<AccountWithBalance>(
    `SELECT a.*,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)
       as balance,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0)
       + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.baseAmount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN t.baseAmount ELSE 0 END), 0)
       as baseBalance,
       t.baseCurrency as baseCurrency
     FROM accounts a
     LEFT JOIN transactions t ON t.account_id = a.id
       AND t.date >= ? AND t.date < ?
     WHERE a.is_archived = 0
     GROUP BY a.id
     ORDER BY a.sort_order ASC`,
    [startDate, endDate],
  );
}

export async function getTotalBalance(
  db: SQLiteDatabase,
  yearMonth?: string,
): Promise<number> {
  let startDate: number | undefined;
  let endDate: number | undefined;

  if (yearMonth) {
    [startDate, endDate] = getCurrentMonthRange(yearMonth);
  }

  const sql = `
    SELECT
      COALESCE(SUM(account_balance), 0) as total
    FROM (
      SELECT
        a.id,
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.baseAmount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.baseAmount ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount > 0 THEN t.baseAmount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN t.type = 'transfer' AND t.amount < 0 THEN t.baseAmount ELSE 0 END), 0)
        AS account_balance,
        t.baseCurrency as baseCurrency
      FROM accounts a
      LEFT JOIN transactions t ON t.account_id = a.id
      ${startDate != null && endDate != null ? 'AND t.date >= ? AND t.date < ?' : ''}
      WHERE a.is_archived = 0
      GROUP BY a.id
    ) AS balances
  `;

  const params: number[] = [];
  if (startDate != null && endDate != null) {
    params.push(startDate, endDate);
  }

  const result = await db.getFirstAsync<{ total: number }>(sql, params);
  return result?.total ?? 0;
}

// ─── Write Queries ───

export async function createAccount(
  db: SQLiteDatabase,
  data: AccountFormData,
): Promise<string> {
  const id = generateId();
  const budgetCents = parseToCents(data.budget);

  await db.runAsync(
    `INSERT INTO accounts (id, name, description, type, currency, budget, icon, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.description ?? null, data.type, data.currency, budgetCents, data.icon, data.color],
  );

  return id;
}

export async function updateAccount(
  db: SQLiteDatabase,
  id: string,
  data: AccountFormData,
): Promise<void> {
  const budgetCents = parseToCents(data.budget);

  await db.runAsync(
    `UPDATE accounts SET name = ?, description = ?, type = ?, currency = ?, budget = ?, icon = ?, color = ?, updated_at = strftime('%s','now')
     WHERE id = ?`,
    [data.name, data.description ?? null, data.type, data.currency, budgetCents, data.icon, data.color, id],
  );
}

export async function archiveAccount(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE accounts SET is_archived = 1, updated_at = strftime('%s','now') WHERE id = ?`,
    [id],
  );
}

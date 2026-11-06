import type { SQLiteDatabase } from 'expo-sqlite';

import type { CurrencyKey } from '../currencies';
import type { TransactionInsertData } from '../transactions/types';
import type { Account, AccountFlows, AccountFormData, AccountUsage, AccountWithBalance, FirstAccountData } from './types';

import { computeBaseAmount } from '@/features/currencies/conversion';
import { getRatesForDate } from '@/features/currencies/queries';
import { todayUnix } from '@/features/formatting/helpers';
import { createTransactionRow } from '@/features/transactions/queries';
import { parseToCents } from '@/lib/data/money';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { generateId, withWriteTransaction } from '@/lib/sqlite';
import { SEED_ACCOUNT_ID } from '@/lib/sqlite/seed';

// ─── Read Queries ───

// How much a row moves its account's balance; a transfer leg's direction is the sign of t.amount.
function signedAmountSql(column: 'amount' | 'baseAmount'): string {
  return `CASE
  WHEN t.type = 'income' THEN t.${column}
  WHEN t.type = 'expense' THEN -t.${column}
  WHEN t.amount < 0 THEN -ABS(t.${column})
  WHEN t.amount > 0 THEN t.${column}
  ELSE 0
END`;
}

export const SIGNED_BASE_AMOUNT = signedAmountSql('baseAmount');

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
       COALESCE(SUM(${signedAmountSql('amount')}), 0)
       as balance,
       COALESCE(SUM(${SIGNED_BASE_AMOUNT}), 0)
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
       COALESCE(SUM(${signedAmountSql('amount')}), 0)
       as balance,
       COALESCE(SUM(${SIGNED_BASE_AMOUNT}), 0)
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
        COALESCE(SUM(${SIGNED_BASE_AMOUNT}), 0)
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

/** Balance (Preferred Currency) before `startDate`, plus per-date changes in `[startDate, endDate)` and the opening-balance share of them (`adjusted`); all active accounts unless `accountId` is given. */
export async function getBalanceSeries(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
  accountId?: string,
): Promise<{ opening: number; adjusted: number; deltas: { date: number; delta: number }[] }> {
  const from = `FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE ${accountId ? 't.account_id = ?' : 'a.is_archived = 0'}`;
  const scope = accountId ? [accountId] : [];
  const [openingRow, adjustedRow, deltas] = await Promise.all([
    db.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(${SIGNED_BASE_AMOUNT}), 0) AS total ${from} AND t.date < ?`, [...scope, startDate]),
    db.getFirstAsync<{ total: number }>(`SELECT COALESCE(SUM(${SIGNED_BASE_AMOUNT}), 0) AS total ${from} AND t.is_adjustment = 1 AND t.date >= ? AND t.date < ?`, [...scope, startDate, endDate]),
    db.getAllAsync<{ date: number; delta: number }>(
      `SELECT t.date AS date, SUM(${SIGNED_BASE_AMOUNT}) AS delta ${from} AND t.date >= ? AND t.date < ? GROUP BY t.date ORDER BY t.date`,
      [...scope, startDate, endDate],
    ),
  ]);
  return { opening: openingRow?.total ?? 0, adjusted: adjustedRow?.total ?? 0, deltas };
}

/** Per-account net change in `[startDate, endDate)`, transfers included, opening-balance adjustments excluded. */
export async function getAccountNetChanges(
  db: SQLiteDatabase,
  startDate: number,
  endDate: number,
): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<{ account_id: string; delta: number }>(
    `SELECT t.account_id AS account_id, SUM(${SIGNED_BASE_AMOUNT}) AS delta FROM transactions t
     WHERE t.is_adjustment = 0 AND t.date >= ? AND t.date < ? GROUP BY t.account_id`,
    [startDate, endDate],
  );
  return Object.fromEntries(rows.map((row) => [row.account_id, row.delta]));
}

/** Preferred Currency totals in the range; `movedOut` is outgoing transfer legs, adjustments excluded. */
export async function getAccountFlows(
  db: SQLiteDatabase,
  accountId: string,
  startDate: number | undefined,
  endDate: number | undefined,
): Promise<AccountFlows> {
  const hasRange = !!startDate && !!endDate;
  const row = await db.getFirstAsync<AccountFlows>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN baseAmount ELSE 0 END), 0) as income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN baseAmount ELSE 0 END), 0) as expense,
       COALESCE(SUM(CASE WHEN type = 'transfer' AND amount < 0 AND is_adjustment = 0 THEN ABS(baseAmount) ELSE 0 END), 0) as movedOut
     FROM transactions
     WHERE account_id = ?
     ${hasRange ? 'AND date >= ? AND date < ?' : ''}`,
    hasRange ? [accountId, startDate, endDate] : [accountId],
  );
  return row ?? { income: 0, expense: 0, movedOut: 0 };
}

/** `transactions` excludes the account's own opening-balance adjustment. */
export async function getAccountUsage(db: SQLiteDatabase, id: string): Promise<AccountUsage> {
  const row = await db.getFirstAsync<AccountUsage>(
    `SELECT
       (SELECT COUNT(*) FROM transactions WHERE account_id = ? AND NOT (is_adjustment = 1 AND transfer_id IS NULL)) AS transactions,
       (SELECT COUNT(*) FROM recurring_rules WHERE account_id = ?) AS rules,
       (SELECT COUNT(*) FROM recurring_rules WHERE account_id = ? AND is_active = 1) AS activeRules`,
    [id, id, id],
  );
  return row ?? { transactions: 0, rules: 0, activeRules: 0 };
}

export function isAccountDeletable(usage: AccountUsage) {
  return usage.transactions === 0 && usage.rules === 0;
}

export async function getArchivedAccounts(db: SQLiteDatabase): Promise<Account[]> {
  return db.getAllAsync<Account>('SELECT * FROM accounts WHERE is_archived = 1 ORDER BY sort_order ASC');
}

// ─── Write Queries ───

/** A single dated `transfer` row flagged `is_adjustment`, signed in the account currency. */
async function buildOpeningBalance(
  db: SQLiteDatabase,
  openingBalance: string | null | undefined,
  currency: CurrencyKey,
  baseCurrency: CurrencyKey,
): Promise<Omit<TransactionInsertData, 'account_id'> | null> {
  const amount = parseToCents(openingBalance);
  if (!amount) return null;
  const date = todayUnix();
  const rates = currency === baseCurrency ? {} : await getRatesForDate(db, date);
  return {
    category_id: null,
    type: 'transfer',
    amount,
    currency,
    baseAmount: computeBaseAmount(Math.abs(amount), currency, baseCurrency, rates),
    baseCurrency,
    date,
    note: null,
    merchant_name: null,
    merchant_logo_slug: null,
    location: null,
    is_adjustment: 1,
  };
}

async function insertAccount(db: SQLiteDatabase, id: string, data: AccountFormData) {
  await db.runAsync(
    `INSERT INTO accounts (id, name, description, type, currency, budget, icon, color, sort_order)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(MAX(sort_order), -1) + 1 FROM accounts`,
    [id, data.name, data.description ?? null, data.type, data.currency, parseToCents(data.budget), data.icon, data.color],
  );
}

export async function createAccount(
  db: SQLiteDatabase,
  data: AccountFormData,
  baseCurrency: CurrencyKey,
): Promise<string> {
  const id = generateId();
  const opening = await buildOpeningBalance(db, data.opening_balance, data.currency, baseCurrency);
  await withWriteTransaction(db, async () => {
    await insertAccount(db, id, data);
    if (opening) await createTransactionRow(db, generateId(), { ...opening, account_id: id });
  });
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

const UNUSED_SEED_GUARD = `WHERE id = ? AND NOT EXISTS (SELECT 1 FROM transactions WHERE account_id = ?)`;

/** Onboarding: rewrites the seeded account while it has no transactions; otherwise Add creates a new account and Skip is a no-op. The opening balance lands on whichever account Add wrote. */
export async function setupFirstAccount(
  db: SQLiteDatabase,
  data: FirstAccountData | null,
  preferredCurrency: CurrencyKey,
): Promise<void> {
  if (!data) {
    await db.runAsync(
      `UPDATE accounts SET currency = ?, updated_at = strftime('%s','now') ${UNUSED_SEED_GUARD}`,
      [preferredCurrency, SEED_ACCOUNT_ID, SEED_ACCOUNT_ID],
    );
    return;
  }

  const opening = await buildOpeningBalance(db, data.opening_balance, data.currency, preferredCurrency);
  await withWriteTransaction(db, async () => {
    const { changes } = await db.runAsync(
      `UPDATE accounts SET name = ?, icon = ?, type = ?, currency = ?, updated_at = strftime('%s','now') ${UNUSED_SEED_GUARD}`,
      [data.name, data.icon, data.type, data.currency, SEED_ACCOUNT_ID, SEED_ACCOUNT_ID],
    );
    const accountId = changes > 0 ? SEED_ACCOUNT_ID : generateId();
    if (changes === 0) await insertAccount(db, accountId, { ...data, description: null, budget: null, color: null });
    if (opening) await createTransactionRow(db, generateId(), { ...opening, account_id: accountId });
  });
}

/** Also pauses the account's active recurring rules; unarchiving does not resume them. */
export async function archiveAccount(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await withWriteTransaction(db, async () => {
    await db.runAsync(
      `UPDATE accounts SET is_archived = 1, updated_at = strftime('%s','now') WHERE id = ?`,
      [id],
    );
    await db.runAsync(
      `UPDATE recurring_rules SET is_active = 0, updated_at = strftime('%s','now') WHERE account_id = ? AND is_active = 1`,
      [id],
    );
  });
}

export class AccountInUseError extends Error {
  constructor() {
    super('Account has transactions or recurring rules');
    this.name = 'AccountInUseError';
  }
}

/** Only for an account with nothing but its opening balance; removes both. */
export async function deleteAccount(db: SQLiteDatabase, id: string): Promise<void> {
  await withWriteTransaction(db, async () => {
    if (!isAccountDeletable(await getAccountUsage(db, id))) throw new AccountInUseError();
    await db.runAsync('DELETE FROM transactions WHERE account_id = ?', [id]);
    await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
  });
}

export async function unarchiveAccount(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync(
    `UPDATE accounts SET is_archived = 0, updated_at = strftime('%s','now') WHERE id = ?`,
    [id],
  );
}

export async function updateAccountOrder(
  db: SQLiteDatabase,
  items: Array<{ id: string; sort_order: number }>,
): Promise<void> {
  await withWriteTransaction(db, async () => {
    for (const item of items) {
      await db.runAsync('UPDATE accounts SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
  });
}

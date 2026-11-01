import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ScheduledTransaction,
  ScheduledTransactionFormData,
  ScheduledTransactionRun,
  ScheduledTransactionWithDetails,
} from './types';
import type { Transaction } from '@/features/transactions/types';

import { amountToCents } from '@/features/formatting/helpers';
import { generateId, insertRow, withWriteTransaction } from '@/lib/sqlite';
import { getFirstDueOnOrAfter, isoDateToUnix, todayISODate, unixToISODate } from './scheduler';

function normalizeText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized || null;
}

function deriveScheduleState(
  data: Pick<
    ScheduledTransactionFormData,
    'end_date' | 'frequency' | 'is_active' | 'start_date'
  >,
) {
  const todayStr = todayISODate();
  const nextDueDateStr = getFirstDueOnOrAfter({
    startDate: unixToISODate(data.start_date),
    frequency: data.frequency,
    targetDate: todayStr,
    endDate: data.end_date != null ? unixToISODate(data.end_date) : null,
  });

  const nextDueDate = nextDueDateStr != null
    ? isoDateToUnix(nextDueDateStr)
    : (data.end_date ?? data.start_date);

  return {
    isActive: data.is_active && nextDueDateStr !== null,
    nextDueDate,
  };
}

// ─── Read Queries ───

export async function getScheduledTransactions(
  db: SQLiteDatabase,
): Promise<ScheduledTransactionWithDetails[]> {
  return db.getAllAsync<ScheduledTransactionWithDetails>(
    `SELECT
      r.*,
      a.name AS account_name,
      a.icon AS account_icon,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color
     FROM recurring_rules r
     LEFT JOIN accounts a ON a.id = r.account_id
     LEFT JOIN categories c ON c.id = r.category_id
     ORDER BY r.is_active DESC, r.next_due_date ASC, r.created_at DESC`,
  );
}

export async function getScheduledTransactionById(
  db: SQLiteDatabase,
  id: string,
): Promise<ScheduledTransactionWithDetails | null> {
  return db.getFirstAsync<ScheduledTransactionWithDetails>(
    `SELECT
      r.*,
      a.name AS account_name,
      a.icon AS account_icon,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color
     FROM recurring_rules r
     LEFT JOIN accounts a ON a.id = r.account_id
     LEFT JOIN categories c ON c.id = r.category_id
     WHERE r.id = ?`,
    [id],
  );
}

export type TransactionRule = Pick<ScheduledTransaction, 'id' | 'frequency' | 'next_due_date' | 'is_active'>;

/** The rule that generated a transaction, via `recurring_rule_runs`. */
export async function getRuleForTransaction(
  db: SQLiteDatabase,
  transactionId: string,
): Promise<TransactionRule | null> {
  return db.getFirstAsync<TransactionRule>(
    `SELECT r.id, r.frequency, r.next_due_date, r.is_active
     FROM recurring_rule_runs rr
     JOIN recurring_rules r ON r.id = rr.rule_id
     WHERE rr.transaction_id = ?`,
    [transactionId],
  );
}

export type RulePayment = Pick<Transaction, 'id' | 'date' | 'baseAmount' | 'baseCurrency'>;

/** Latest transactions posted by a rule, newest first. */
export async function getRulePayments(
  db: SQLiteDatabase,
  ruleId: string,
  limit: number,
): Promise<RulePayment[]> {
  return db.getAllAsync<RulePayment>(
    `SELECT t.id, t.date, t.baseAmount, t.baseCurrency
     FROM recurring_rule_runs rr
     JOIN transactions t ON t.id = rr.transaction_id
     WHERE rr.rule_id = ?
     ORDER BY t.date DESC, t.id DESC
     LIMIT ?`,
    [ruleId, limit],
  );
}

// ─── Write Queries ───

export class RuleAccountArchivedError extends Error {
  constructor() {
    super('Cannot activate a recurring rule on an archived account');
    this.name = 'RuleAccountArchivedError';
  }
}

async function assertAccountUnarchived(db: SQLiteDatabase, accountId: string, isActive: boolean) {
  if (!isActive) return;
  const account = await db.getFirstAsync<{ is_archived: number }>('SELECT is_archived FROM accounts WHERE id = ?', [accountId]);
  if (account?.is_archived) throw new RuleAccountArchivedError();
}

export async function createScheduledTransaction(
  db: SQLiteDatabase,
  data: ScheduledTransactionFormData,
): Promise<string> {
  const id = generateId();
  const amount = amountToCents(Number(data.amount) || 0);
  const scheduleState = deriveScheduleState(data);

  await withWriteTransaction(db, async () => {
    await assertAccountUnarchived(db, data.account_id, scheduleState.isActive);
    await db.runAsync(
      `INSERT INTO recurring_rules (
        id,
        account_id,
        category_id,
        type,
        amount,
        currency,
        note,
        frequency,
        start_date,
        end_date,
        next_due_date,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.account_id,
        data.category_id,
        data.type,
        amount,
        data.currency,
        normalizeText(data.note),
        data.frequency,
        data.start_date,
        data.end_date || null,
        scheduleState.nextDueDate,
        Number(scheduleState.isActive),
      ],
    );
  });

  return id;
}

export async function updateScheduledTransaction(
  db: SQLiteDatabase,
  id: string,
  data: ScheduledTransactionFormData,
): Promise<void> {
  const amount = amountToCents(Number(data.amount) || 0);
  const scheduleState = deriveScheduleState(data);

  await withWriteTransaction(db, async () => {
    await assertAccountUnarchived(db, data.account_id, scheduleState.isActive);
    await db.runAsync(
      `UPDATE recurring_rules
       SET
         account_id = ?,
         category_id = ?,
         type = ?,
         amount = ?,
         currency = ?,
         note = ?,
         frequency = ?,
         start_date = ?,
         end_date = ?,
         next_due_date = ?,
         is_active = ?,
         updated_at = strftime('%s','now')
       WHERE id = ?`,
      [
        data.account_id,
        data.category_id,
        data.type,
        amount,
        data.currency,
        normalizeText(data.note),
        data.frequency,
        data.start_date,
        data.end_date || null,
        scheduleState.nextDueDate,
        Number(scheduleState.isActive),
        id,
      ],
    );
  });
}

/** Everything a rule delete removes; its generated transactions stay. */
export type DeletedScheduledTransaction = {
  rule: ScheduledTransaction | null;
  runs: ScheduledTransactionRun[];
};

export async function deleteScheduledTransaction(
  db: SQLiteDatabase,
  id: string,
): Promise<DeletedScheduledTransaction> {
  const deleted: DeletedScheduledTransaction = { rule: null, runs: [] };
  await withWriteTransaction(db, async () => {
    deleted.rule = await db.getFirstAsync<ScheduledTransaction>('SELECT * FROM recurring_rules WHERE id = ?', [id]);
    deleted.runs = await db.getAllAsync<ScheduledTransactionRun>('SELECT * FROM recurring_rule_runs WHERE rule_id = ?', [id]);
    await db.runAsync('DELETE FROM recurring_rules WHERE id = ?', [id]);
  });
  return deleted;
}

/** Re-inserts the rule as snapshotted, including its next_due_date; throws without writing if anything conflicts. */
export async function restoreScheduledTransaction(
  db: SQLiteDatabase,
  { rule, runs }: DeletedScheduledTransaction,
): Promise<void> {
  if (!rule) return;
  await withWriteTransaction(db, async () => {
    await insertRow(db, 'recurring_rules', rule);
    for (const run of runs) await insertRow(db, 'recurring_rule_runs', run);
  });
}

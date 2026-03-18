import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ScheduledTransactionFormData,
  ScheduledTransactionWithDetails,
} from './types';

import { amountToCents, todayISO } from '@/features/formatting/helpers';
import { generateId } from '@/lib/sqlite';
import { getFirstDueOnOrAfter } from './scheduler';

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
  const nextDueDate = getFirstDueOnOrAfter({
    startDate: data.start_date,
    frequency: data.frequency,
    targetDate: todayISO(),
    endDate: data.end_date,
  });

  return {
    isActive: data.is_active && nextDueDate !== null,
    nextDueDate: nextDueDate ?? data.end_date ?? data.start_date,
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

// ─── Write Queries ───

export async function createScheduledTransaction(
  db: SQLiteDatabase,
  data: ScheduledTransactionFormData,
): Promise<string> {
  const id = generateId();
  const amount = amountToCents(Number(data.amount) || 0);
  const scheduleState = deriveScheduleState(data);

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

  return id;
}

export async function updateScheduledTransaction(
  db: SQLiteDatabase,
  id: string,
  data: ScheduledTransactionFormData,
): Promise<void> {
  const amount = amountToCents(Number(data.amount) || 0);
  const scheduleState = deriveScheduleState(data);

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
       updated_at = datetime('now')
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
}

export async function deleteScheduledTransaction(
  db: SQLiteDatabase,
  id: string,
): Promise<void> {
  await db.runAsync('DELETE FROM recurring_rules WHERE id = ?', [id]);
}

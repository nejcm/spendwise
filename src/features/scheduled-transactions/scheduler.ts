import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ScheduledRunPlan,
  ScheduledTransaction,
  ScheduledTransactionFrequency,
} from './types';
import { addDays, addMonths, addWeeks, addYears, format, parseISO } from 'date-fns';
import { generateId } from '@/lib/sqlite';

type ProcessResult = {
  createdTransactions: number;
  updatedRules: number;
};

function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function advanceScheduledDate(
  date: string,
  frequency: ScheduledTransactionFrequency,
): string {
  const baseDate = parseISO(date);

  switch (frequency) {
    case 'daily':
      return formatISODate(addDays(baseDate, 1));
    case 'weekly':
      return formatISODate(addWeeks(baseDate, 1));
    case 'biweekly':
      return formatISODate(addWeeks(baseDate, 2));
    case 'monthly':
      return formatISODate(addMonths(baseDate, 1));
    case 'yearly':
      return formatISODate(addYears(baseDate, 1));
  }
}

export function getFirstDueOnOrAfter(args: {
  endDate?: string | null;
  frequency: ScheduledTransactionFrequency;
  startDate: string;
  targetDate: string;
}): string | null {
  const { startDate, frequency, targetDate, endDate } = args;

  let cursor = startDate;
  while (cursor < targetDate) {
    cursor = advanceScheduledDate(cursor, frequency);
  }

  if (endDate && cursor > endDate) {
    return null;
  }

  return cursor;
}

export function planScheduledRuns(
  rule: Pick<ScheduledTransaction, 'end_date' | 'frequency' | 'is_active' | 'next_due_date'>,
  untilDate: string,
  existingRunDates: Set<string> = new Set(),
): ScheduledRunPlan {
  let cursor = rule.next_due_date;
  const dueDates: string[] = [];

  if (!rule.is_active) {
    return {
      dueDates,
      isActive: false,
      nextDueDate: cursor,
    };
  }

  while (cursor <= untilDate && (!rule.end_date || cursor <= rule.end_date)) {
    if (!existingRunDates.has(cursor)) {
      dueDates.push(cursor);
    }
    cursor = advanceScheduledDate(cursor, rule.frequency);
  }

  const isActive = !rule.end_date || cursor <= rule.end_date;

  return {
    dueDates,
    isActive,
    nextDueDate: cursor,
  };
}

export function buildGeneratedTransactionNote(note?: string | null): string | null {
  const normalized = note?.trim();
  return normalized || null;
}

type ScheduledRunRow = {
  scheduled_for_date: string;
};

export async function processDueScheduledTransactions(
  db: SQLiteDatabase,
  today: string,
): Promise<ProcessResult> {
  const rules = await db.getAllAsync<ScheduledTransaction>(
    `SELECT *
     FROM recurring_rules
     WHERE is_active = 1 AND next_due_date <= ?
     ORDER BY next_due_date ASC, created_at ASC`,
    [today],
  );

  let createdTransactions = 0;
  let updatedRules = 0;

  await db.withTransactionAsync(async () => {
    for (const rule of rules) {
      const existingRuns = await db.getAllAsync<ScheduledRunRow>(
        `SELECT scheduled_for_date
         FROM recurring_rule_runs
         WHERE rule_id = ? AND scheduled_for_date <= ?`,
        [rule.id, today],
      );

      const plan = planScheduledRuns(
        rule,
        today,
        new Set(existingRuns.map((run) => run.scheduled_for_date)),
      );

      for (const dueDate of plan.dueDates) {
        const transactionId = generateId();
        const transactionNote = buildGeneratedTransactionNote(rule.note);

        await db.runAsync(
          `INSERT INTO transactions (
            id,
            account_id,
            category_id,
            type,
            amount,
            currency,
            date,
            note
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            rule.account_id,
            rule.category_id,
            rule.type,
            rule.amount,
            rule.currency,
            dueDate,
            transactionNote,
          ],
        );

        const runInsertResult = await db.runAsync(
          `INSERT OR IGNORE INTO recurring_rule_runs (
            id,
            rule_id,
            scheduled_for_date,
            transaction_id
          )
          VALUES (?, ?, ?, ?)`,
          [generateId(), rule.id, dueDate, transactionId],
        );

        if ((runInsertResult.changes ?? 0) === 0) {
          await db.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
          continue;
        }

        createdTransactions += 1;
      }

      if (plan.nextDueDate !== rule.next_due_date || Number(plan.isActive) !== rule.is_active) {
        await db.runAsync(
          `UPDATE recurring_rules
           SET next_due_date = ?, is_active = ?, updated_at = datetime('now')
           WHERE id = ?`,
          [plan.nextDueDate, Number(plan.isActive), rule.id],
        );
        updatedRules += 1;
      }
    }
  });

  return { createdTransactions, updatedRules };
}

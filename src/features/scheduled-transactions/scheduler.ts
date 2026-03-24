import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  ScheduledRunPlan,
  ScheduledTransaction,
  ScheduledTransactionFrequency,
} from './types';
import { addDays, addMonths, addWeeks, addYears, format, parseISO } from 'date-fns';
import { computeBaseAmount } from '@/features/currencies/conversion';
import { getRatesForDate } from '@/features/currencies/queries';
import { unixToISODate } from '@/lib/date/helpers';
import { generateId } from '@/lib/sqlite';
import { getAppState } from '@/lib/store';

export { unixToISODate };

export function isoDateToUnix(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

// ─── Internal scheduling logic (strings) ───

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
  untilUnix: number,
  existingRunUnix: Set<number> = new Set(),
): ScheduledRunPlan {
  const untilDate = unixToISODate(untilUnix);
  let cursorStr = unixToISODate(rule.next_due_date);
  const endDateStr = rule.end_date != null ? unixToISODate(rule.end_date) : null;
  const dueDates: number[] = [];

  if (!rule.is_active) {
    return {
      dueDates,
      isActive: false,
      nextDueDate: rule.next_due_date,
    };
  }

  while (cursorStr <= untilDate) {
    if (endDateStr && cursorStr > endDateStr) break;
    const cursorUnix = isoDateToUnix(cursorStr);
    if (!existingRunUnix.has(cursorUnix)) {
      dueDates.push(cursorUnix);
    }
    cursorStr = advanceScheduledDate(cursorStr, rule.frequency);
  }

  const isActive = !endDateStr || cursorStr <= endDateStr;

  return {
    dueDates,
    isActive,
    nextDueDate: isoDateToUnix(cursorStr),
  };
}

export function buildGeneratedTransactionNote(note?: string | null): string | null {
  const normalized = note?.trim();
  return normalized || null;
}

type ScheduledRunRow = {
  scheduled_for_date: number;
};

export async function processDueScheduledTransactions(
  db: SQLiteDatabase,
  todayUnix: number,
): Promise<ProcessResult> {
  const rules = await db.getAllAsync<ScheduledTransaction>(
    `SELECT *
     FROM recurring_rules
     WHERE is_active = 1 AND next_due_date <= ?
     ORDER BY next_due_date ASC, created_at ASC`,
    [todayUnix],
  );

  let createdTransactions = 0;
  let updatedRules = 0;

  await db.withTransactionAsync(async () => {
    for (const rule of rules) {
      const existingRuns = await db.getAllAsync<ScheduledRunRow>(
        `SELECT scheduled_for_date
         FROM recurring_rule_runs
         WHERE rule_id = ? AND scheduled_for_date <= ?`,
        [rule.id, todayUnix],
      );

      const plan = planScheduledRuns(
        rule,
        todayUnix,
        new Set(existingRuns.map((run) => run.scheduled_for_date)),
      );

      const preferredCurrency = getAppState().currency;
      for (const dueDateUnix of plan.dueDates) {
        const transactionId = generateId();
        const transactionNote = buildGeneratedTransactionNote(rule.note);
        const rates = await getRatesForDate(db, dueDateUnix);
        const baseAmount = computeBaseAmount(rule.amount, rule.currency, preferredCurrency, rates);

        await db.runAsync(
          `INSERT INTO transactions (
            id,
            account_id,
            category_id,
            type,
            amount,
            currency,
            baseAmount,
            baseCurrency,
            date,
            note
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionId,
            rule.account_id,
            rule.category_id,
            rule.type,
            rule.amount,
            rule.currency,
            baseAmount,
            preferredCurrency,
            dueDateUnix,
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
          [generateId(), rule.id, dueDateUnix, transactionId],
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
           SET next_due_date = ?, is_active = ?, updated_at = strftime('%s','now')
           WHERE id = ?`,
          [plan.nextDueDate, Number(plan.isActive), rule.id],
        );
        updatedRules += 1;
      }
    }
  });

  return { createdTransactions, updatedRules };
}

// ─── Legacy string-based helpers (used by queries.ts deriveScheduleState) ───

export function todayISODate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

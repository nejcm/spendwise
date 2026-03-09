import type { SQLiteDatabase } from 'expo-sqlite';

import type { RecurringFormData, RecurringRule, RecurringRuleWithCategory } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, addMonths, addWeeks, addYears, format, parseISO } from 'date-fns';
import { useSQLiteContext } from 'expo-sqlite';

import { amountToCents, todayISO } from '@/lib/format';
import { generateId } from '@/lib/sqlite';

const keys = {
  rules: ['recurring-rules'] as const,
};

// ─── Query Hooks ───

export function useRecurringRules() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: keys.rules,
    queryFn: () => getRules(db),
  });
}

export function useCreateRecurringRule() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecurringFormData) => createRule(db, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.rules }),
  });
}

export function useDeleteRecurringRule() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      db.runAsync('UPDATE recurring_rules SET is_active = 0 WHERE id = ?', [id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.rules }),
  });
}

// ─── Auto-generation on app open ───

export async function processRecurringRules(db: SQLiteDatabase): Promise<void> {
  const today = todayISO();
  const dueRules = await db.getAllAsync<RecurringRule>(
    `SELECT * FROM recurring_rules
     WHERE is_active = 1 AND next_due_date <= ?
     AND (end_date IS NULL OR end_date >= next_due_date)`,
    [today],
  );

  for (const rule of dueRules) {
    await generateTransaction(db, rule);
    const nextDate = computeNextDueDate(rule.next_due_date, rule.frequency);
    await db.runAsync(
      'UPDATE recurring_rules SET next_due_date = ? WHERE id = ?',
      [nextDate, rule.id],
    );
  }
}

// ─── Database Functions ───

async function getRules(db: SQLiteDatabase): Promise<RecurringRuleWithCategory[]> {
  return db.getAllAsync<RecurringRuleWithCategory>(
    `SELECT r.*, c.name as category_name, c.color as category_color
     FROM recurring_rules r
     LEFT JOIN categories c ON r.category_id = c.id
     WHERE r.is_active = 1
     ORDER BY r.next_due_date ASC`,
  );
}

async function createRule(db: SQLiteDatabase, data: RecurringFormData): Promise<string> {
  const id = generateId();
  const cents = amountToCents(Number.parseFloat(data.amount) || 0);

  await db.runAsync(
    `INSERT INTO recurring_rules
       (id, account_id, category_id, type, amount, note, payee, frequency, start_date, next_due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.account_id,
      data.category_id,
      data.type,
      cents,
      data.note || null,
      data.payee || null,
      data.frequency,
      data.start_date,
      data.start_date,
    ],
  );

  return id;
}

async function generateTransaction(db: SQLiteDatabase, rule: RecurringRule): Promise<void> {
  const txId = generateId();
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, category_id, type, amount, date, note, payee, recurring_rule_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [txId, rule.account_id, rule.category_id, rule.type, rule.amount, rule.next_due_date, rule.note, rule.payee, rule.id],
  );
}

function computeNextDueDate(currentDate: string, frequency: RecurringRule['frequency']): string {
  const date = parseISO(currentDate);
  switch (frequency) {
    case 'daily': return format(addDays(date, 1), 'yyyy-MM-dd');
    case 'weekly': return format(addWeeks(date, 1), 'yyyy-MM-dd');
    case 'biweekly': return format(addWeeks(date, 2), 'yyyy-MM-dd');
    case 'monthly': return format(addMonths(date, 1), 'yyyy-MM-dd');
    case 'yearly': return format(addYears(date, 1), 'yyyy-MM-dd');
  }
}

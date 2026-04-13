import type { SQLiteDatabase } from 'expo-sqlite';
import type { Account } from '../accounts/types';
import type { Category } from '../categories/types';
import type { ScheduledTransaction, ScheduledTransactionRun } from '../scheduled-transactions/types';
import type { Transaction } from '../transactions/types';
import { clearDbData } from '@/lib/sqlite/db';

export type BackupData = {
  version: 1;
  exported_at: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurring_rules: ScheduledTransaction[];
  recurring_rule_runs: ScheduledTransactionRun[];
};

export async function exportBackup(db: SQLiteDatabase): Promise<BackupData> {
  const [
    accounts,
    categories,
    transactions,
    recurring_rules,
    recurring_rule_runs,
  ] = await Promise.all([
    db.getAllAsync<Account>('SELECT * FROM accounts'),
    db.getAllAsync<Category>('SELECT * FROM categories'),
    db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC'),
    db.getAllAsync<ScheduledTransaction>('SELECT * FROM recurring_rules'),
    db.getAllAsync<ScheduledTransactionRun>('SELECT * FROM recurring_rule_runs'),
  ]);

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    accounts,
    categories,
    transactions,
    recurring_rules,
    recurring_rule_runs,
  };
}

export function validateBackup(parsed: unknown): BackupData {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('invalid');
  }

  const data = parsed as Record<string, unknown>;

  if (data.version !== 1) {
    throw new Error('invalid');
  }

  const requiredArrays: (keyof BackupData)[] = [
    'accounts',
    'categories',
    'transactions',
    'recurring_rules',
    'recurring_rule_runs',
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      throw new TypeError('invalid');
    }
  }

  return data as BackupData;
}

export async function importBackup(db: SQLiteDatabase, backup: BackupData): Promise<void> {
  // Clear all existing data (FK constraints disabled inside clearDbData)
  await clearDbData(db);

  await db.withTransactionAsync(async () => {
    for (const row of backup.categories) {
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, budget, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name, row.icon ?? null, row.color, row.budget ?? null, row.sort_order ?? 999999, row.created_at],
      );
    }

    for (const row of backup.accounts) {
      await db.runAsync(
        `INSERT INTO accounts (id, name, description, type, currency, budget, icon, color, is_archived, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.name,
          row.description ?? null,
          row.type,
          row.currency ?? 'EUR',
          row.budget ?? null,
          row.icon ?? null,
          row.color ?? null,
          row.is_archived ?? 0,
          row.sort_order ?? 999999,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    for (const row of backup.transactions) {
      await db.runAsync(
        `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.account_id,
          row.category_id ?? null,
          row.type,
          row.amount,
          row.currency ?? 'EUR',
          row.baseAmount,
          row.baseCurrency,
          row.date,
          row.note ?? null,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    for (const row of backup.recurring_rules) {
      await db.runAsync(
        `INSERT INTO recurring_rules (id, account_id, category_id, type, amount, currency, note, frequency, start_date, end_date, next_due_date, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.account_id,
          row.category_id ?? null,
          row.type,
          row.amount,
          row.currency ?? 'EUR',
          row.note ?? null,
          row.frequency,
          row.start_date,
          row.end_date ?? null,
          row.next_due_date,
          row.is_active ?? 1,
          row.created_at,
          row.updated_at,
        ],
      );
    }

    for (const row of backup.recurring_rule_runs) {
      await db.runAsync(
        `INSERT INTO recurring_rule_runs (id, rule_id, scheduled_for_date, transaction_id, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [row.id, row.rule_id, row.scheduled_for_date, row.transaction_id, row.created_at],
      );
    }
  });
}

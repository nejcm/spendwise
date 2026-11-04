import type { SQLiteDatabase } from 'expo-sqlite';
import type { Account } from '../accounts/types';
import type { Category } from '../categories/types';
import type { ScheduledTransaction, ScheduledTransactionRun } from '../scheduled-transactions/types';
import type { Transaction } from '../transactions/types';
import type { CurrencyKey } from '@/features/currencies';
import { CURRENCY_VALUES } from '@/features/currencies';
import { withWriteTransaction } from '@/lib/sqlite';
import { clearDbData } from '@/lib/sqlite/db';
import { BACKFILL_CATEGORY_KIND_SQL } from '@/lib/sqlite/migrations';
import { getAppState, setCurrency } from '@/lib/store/store';

const CURRENT_BACKUP_VERSION = 5;

type TransactionTagRow = { transaction_id: string; tag: string };

export type BackupData = {
  version: number;
  baseCurrency?: string;
  exported_at: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recurring_rules: ScheduledTransaction[];
  recurring_rule_runs: ScheduledTransactionRun[];
  /** Absent before v5. */
  transaction_tags?: TransactionTagRow[];
};

export async function exportBackup(db: SQLiteDatabase): Promise<BackupData> {
  const [
    accounts,
    categories,
    transactions,
    recurring_rules,
    recurring_rule_runs,
    transaction_tags,
  ] = await Promise.all([
    db.getAllAsync<Account>('SELECT * FROM accounts'),
    db.getAllAsync<Category>('SELECT * FROM categories'),
    db.getAllAsync<Transaction>('SELECT * FROM transactions ORDER BY date DESC'),
    db.getAllAsync<ScheduledTransaction>('SELECT * FROM recurring_rules'),
    db.getAllAsync<ScheduledTransactionRun>('SELECT * FROM recurring_rule_runs'),
    db.getAllAsync<TransactionTagRow>('SELECT transaction_id, tag FROM transaction_tags'),
  ]);

  const baseCurrency = getAppState().currency;

  return {
    version: CURRENT_BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    baseCurrency,
    accounts,
    categories,
    transactions,
    recurring_rules,
    recurring_rule_runs,
    transaction_tags,
  };
}

export function validateBackup(parsed: unknown): BackupData {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('invalid');
  }

  const data = parsed as Record<string, unknown>;

  const version = data.version;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > CURRENT_BACKUP_VERSION) {
    throw new Error('invalid');
  }

  const requiredArrays: (keyof BackupData)[] = [
    'accounts',
    'categories',
    'transactions',
    'recurring_rules',
    'recurring_rule_runs',
  ];

  if (version >= 5) requiredArrays.push('transaction_tags');

  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      throw new TypeError('invalid');
    }
  }

  const tags = data.transaction_tags ?? [];
  if (!Array.isArray(tags) || !tags.every(isTransactionTagRow)) {
    throw new TypeError('invalid');
  }

  return data as BackupData;
}

function isTransactionTagRow(row: unknown): row is TransactionTagRow {
  const r = row as Partial<Record<keyof TransactionTagRow, unknown>> | null;
  return typeof r === 'object' && r !== null && typeof r.transaction_id === 'string' && typeof r.tag === 'string';
}

export async function importBackup(db: SQLiteDatabase, backup: BackupData): Promise<void> {
  await withWriteTransaction(db, async () => {
    await clearDbData(db);
    for (const row of backup.categories) {
      await db.runAsync(
        `INSERT INTO categories (id, name, icon, color, kind, budget, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name, row.icon ?? null, row.color, row.kind === 'income' ? 'income' : 'expense', row.budget ?? null, row.sort_order ?? 999999, row.created_at],
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
        `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, baseAmount, baseCurrency, date, note, merchant_name, merchant_logo_slug, location, transfer_id, is_adjustment, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.account_id,
          row.category_id || null,
          row.type,
          row.amount,
          row.currency ?? 'EUR',
          row.type === 'transfer' ? Math.abs(row.baseAmount) : row.baseAmount,
          row.baseCurrency,
          row.date,
          row.note || null,
          row.merchant_name || null,
          row.merchant_logo_slug || null,
          row.location || null,
          row.transfer_id ?? null,
          row.is_adjustment ? 1 : 0,
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

    for (const row of backup.transaction_tags ?? []) {
      await db.runAsync(
        `INSERT INTO transaction_tags (transaction_id, tag) VALUES (?, ?)
         ON CONFLICT(transaction_id, tag) DO NOTHING`,
        [row.transaction_id, row.tag],
      );
    }

    if (backup.version < 4) await db.execAsync(BACKFILL_CATEGORY_KIND_SQL);
  });
}

function inferBackupCurrency(backup: BackupData): CurrencyKey | undefined {
  if ('baseCurrency' in backup) {
    const candidate = backup.baseCurrency;
    if (CURRENCY_VALUES.includes(candidate as CurrencyKey)) return candidate as CurrencyKey;
  }
  const txBaseCurrency = backup.transactions.at(0)?.baseCurrency;
  if (!txBaseCurrency || !CURRENCY_VALUES.includes(txBaseCurrency as CurrencyKey)) return undefined;
  return txBaseCurrency as CurrencyKey;
}

/** Replaces all data with the backup, then adopts its Preferred Currency; a failed import changes neither. */
export async function restoreBackup(db: SQLiteDatabase, backup: BackupData): Promise<void> {
  await importBackup(db, backup);
  const currency = inferBackupCurrency(backup);
  if (currency && currency !== getAppState().currency) setCurrency(currency);
}

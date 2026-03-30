import type { SQLiteDatabase } from 'expo-sqlite';
import { seedDefaults } from './seed';

const DATABASE_VERSION = 1;

/**
 * Clears all data from the database.
 */
export async function clearDbData(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM recurring_rule_runs;
    DELETE FROM recurring_rules;
    DELETE FROM transactions;
    DELETE FROM accounts;
    DELETE FROM categories;
    DELETE FROM currency_rates;
    PRAGMA foreign_keys = ON;
  `);
};

/**
 * Clears all transactions from the database.
 */
export async function clearTransactionsDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM transactions;
  `);
}

/**
 * Drops all tables and sets the user version to 0.
 */
export async function dropDb(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS _meta;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS recurring_rules;
    DROP TABLE IF EXISTS recurring_rule_runs;
    DROP TABLE IF EXISTS currency_rates;
  `);
  await db.execAsync(`PRAGMA user_version = 0`);
}

/**
 * Runs on first open. Sets WAL mode and runs schema migrations via PRAGMA user_version.
 * Bump DATABASE_VERSION and add a migration block when you change the schema.
 */
export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentDbVersion = row?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) return;

  await db.execAsync('PRAGMA journal_mode = \'wal\'');
  await db.execAsync('PRAGMA foreign_keys = ON');

  if (currentDbVersion < 1) {
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS _meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL CHECK(type IN ('cash','checking','savings','credit_card','investment','other')),
          currency TEXT NOT NULL DEFAULT 'EUR',
          budget INTEGER,
          icon TEXT,
          color TEXT,
          is_archived INTEGER NOT NULL DEFAULT 0,
          sort_order INTEGER NOT NULL DEFAULT 999999,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        );

        CREATE INDEX IF NOT EXISTS idx_accounts_active_sort
          ON accounts(is_archived, sort_order, id);

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          icon TEXT,
          color TEXT NOT NULL,
          budget INTEGER,
          sort_order INTEGER NOT NULL DEFAULT 999999,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          account_id TEXT NOT NULL REFERENCES accounts(id),
          category_id TEXT REFERENCES categories(id),
          type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
          amount INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'EUR',
          baseAmount INTEGER NOT NULL DEFAULT 0,
          baseCurrency TEXT NOT NULL DEFAULT 'EUR',
          date INTEGER NOT NULL,
          note TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        );

        CREATE INDEX IF NOT EXISTS idx_transactions_feed
          ON transactions(date DESC, created_at DESC, id DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_category_feed
          ON transactions(category_id, date DESC, created_at DESC, id DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_date_account_type_cover
          ON transactions(date, account_id, type, amount, baseAmount, baseCurrency);
        CREATE INDEX IF NOT EXISTS idx_transactions_date_category_ie_cover
          ON transactions(date, category_id, type, baseAmount)
          WHERE type IN ('income','expense');

        CREATE TABLE IF NOT EXISTS currency_rates (
          base TEXT NOT NULL,
          quote TEXT NOT NULL,
          rate REAL NOT NULL,
          date INTEGER NOT NULL,
          PRIMARY KEY (base, quote, date)
        );

        CREATE INDEX IF NOT EXISTS idx_currency_rates_base_date_desc_cover
          ON currency_rates(base, date DESC, quote, rate);

        CREATE TABLE IF NOT EXISTS recurring_rules (
          id TEXT PRIMARY KEY NOT NULL,
          account_id TEXT NOT NULL REFERENCES accounts(id),
          category_id TEXT REFERENCES categories(id),
          type TEXT NOT NULL CHECK(type IN ('income','expense')),
          amount INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'EUR',
          note TEXT,
          frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','biweekly','monthly','yearly')),
          start_date INTEGER NOT NULL,
          end_date INTEGER,
          next_due_date INTEGER NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS recurring_rule_runs (
          id TEXT PRIMARY KEY NOT NULL,
          rule_id TEXT NOT NULL REFERENCES recurring_rules(id) ON DELETE CASCADE,
          scheduled_for_date INTEGER NOT NULL,
          transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
          UNIQUE(rule_id, scheduled_for_date)
        );
        CREATE INDEX IF NOT EXISTS idx_recurring_rules_active_due_created
          ON recurring_rules(is_active, next_due_date, created_at);
        CREATE INDEX IF NOT EXISTS idx_recurring_rules_active_type_due
          ON recurring_rules(is_active, type, next_due_date);

        CREATE INDEX IF NOT EXISTS idx_recurring_rule_runs_rule_date
          ON recurring_rule_runs(rule_id, scheduled_for_date);
      `);

    await seedDefaults(db);
    await db.execAsync(`PRAGMA user_version = 1`);
  }
}

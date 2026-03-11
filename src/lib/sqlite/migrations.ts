import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

const DATABASE_VERSION = 1;

/**
 * Drops all tables and recreates them. Safe on all platforms.
 * Prefer this over deleteDatabaseAsync on web — that API has a bug where
 * it removes the file from the VFS path map but doesn't return the handle
 * to the available pool, causing SQLITE_CANTOPEN (14) on the next open
 * within the same Worker session.
 */
export async function resetDb(db: SQLiteDatabase): Promise<void> {
  await dropDb(db);
  await migrateDb(db);
  if (Platform.OS === 'web') {
    // Reload the page so the Worker reinitialises its VFS state cleanly.
    window.location.reload();
  }
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
    DROP TABLE IF EXISTS budgets;
    DROP TABLE IF EXISTS budget_lines;
    DROP TABLE IF EXISTS recurring_rules;
    DROP TABLE IF EXISTS goals;
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
        initial_balance INTEGER NOT NULL DEFAULT 0,
        budget INTEGER,
        icon TEXT,
        color TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT NOT NULL,
        default_currency TEXT NOT NULL DEFAULT 'EUR',
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        category_id TEXT REFERENCES categories(id),
        type TEXT NOT NULL CHECK(type IN ('income','expense','transfer')),
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        period TEXT NOT NULL CHECK(period IN ('monthly','weekly','yearly')),
        amount INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS budget_lines (
        id TEXT PRIMARY KEY NOT NULL,
        budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES categories(id),
        amount INTEGER NOT NULL,
        UNIQUE(budget_id, category_id)
      );

      CREATE TABLE IF NOT EXISTS recurring_rules (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL REFERENCES accounts(id),
        category_id TEXT REFERENCES categories(id),
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        amount INTEGER NOT NULL,
        note TEXT,
        payee TEXT,
        frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','biweekly','monthly','yearly')),
        start_date TEXT NOT NULL,
        end_date TEXT,
        next_due_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        target_amount INTEGER NOT NULL,
        current_amount INTEGER NOT NULL DEFAULT 0,
        deadline TEXT,
        icon TEXT,
        color TEXT NOT NULL DEFAULT '#4ECDC4',
        is_completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

  await seedDefaults(db);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function seedDefaults(db: SQLiteDatabase): Promise<void> {
  const expenseCategories = [
    {
      id: 'cat_food',
      name: 'Food & Dining',
      icon: '🍽️',
      color: '#FF6B6B',
    },
    {
      id: 'cat_transport',
      name: 'Transportation',
      icon: '🚗',
      color: '#4ECDC4',
    },
    { id: 'cat_housing', name: 'Housing', icon: '🏠', color: '#45B7D1' },
    { id: 'cat_utilities', name: 'Utilities', icon: '💡', color: '#96CEB4' },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      icon: '🎬',
      color: '#FFEAA7',
    },
    {
      id: 'cat_shopping',
      name: 'Shopping',
      icon: '🛒',
      color: '#DDA0DD',
    },
    {
      id: 'cat_healthcare',
      name: 'Healthcare',
      icon: '🩺',
      color: '#FF8A80',
    },
    { id: 'cat_education', name: 'Education', icon: '🎓', color: '#82B1FF' },
    {
      id: 'cat_personal',
      name: 'Personal Care',
      icon: '🧴',
      color: '#EA80FC',
    },
    {
      id: 'cat_subscriptions',
      name: 'Subscriptions',
      icon: '🔁',
      color: '#B388FF',
    },
    {
      id: 'cat_other_expense',
      name: 'Other',
      icon: '📦',
      color: '#90A4AE',
    },
  ];

  const incomeCategories = [
    { id: 'cat_salary', name: 'Salary', icon: '💼', color: '#66BB6A' },
    {
      id: 'cat_freelance',
      name: 'Freelance',
      icon: '💻',
      color: '#26A69A',
    },
    {
      id: 'cat_investment',
      name: 'Investment',
      icon: '📈',
      color: '#42A5F5',
    },
    {
      id: 'cat_other_income',
      name: 'Other Income',
      icon: '💰',
      color: '#78909C',
    },
  ];

  for (const cat of expenseCategories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.icon, cat.color, 'expense', expenseCategories.indexOf(cat)],
    );
  }

  for (const cat of incomeCategories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [cat.id, cat.name, cat.icon, cat.color, 'income', incomeCategories.indexOf(cat)],
    );
  }
}

import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 2;

/**
 * Runs on first open. Sets WAL mode and runs schema migrations via PRAGMA user_version.
 * Bump DATABASE_VERSION and add a migration block when you change the schema.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentDbVersion = row?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync('PRAGMA journal_mode = \'wal\'');
  await db.execAsync('PRAGMA foreign_keys = ON');

  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS _meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
  }

  if (currentDbVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('cash','checking','savings','credit_card','investment','other')),
        currency TEXT NOT NULL DEFAULT 'EUR',
        initial_balance INTEGER NOT NULL DEFAULT 0,
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
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        parent_id TEXT REFERENCES categories(id),
        is_default INTEGER NOT NULL DEFAULT 0,
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
        payee TEXT,
        transfer_id TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    `);

    await seedDefaultCategories(db);
  }

  // Future migrations:
  // if (currentDbVersion < 3) { ... budgets + budget_lines ... }
  // if (currentDbVersion < 4) { ... recurring_rules ... }
  // if (currentDbVersion < 5) { ... goals ... }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

async function seedDefaultCategories(db: SQLiteDatabase): Promise<void> {
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories WHERE is_default = 1',
  );
  if (existing && existing.count > 0)
    return;

  const expenseCategories = [
    {
      id: 'cat_food',
      name: 'Food & Dining',
      icon: 'utensils',
      color: '#FF6B6B',
    },
    {
      id: 'cat_transport',
      name: 'Transportation',
      icon: 'car',
      color: '#4ECDC4',
    },
    { id: 'cat_housing', name: 'Housing', icon: 'home', color: '#45B7D1' },
    { id: 'cat_utilities', name: 'Utilities', icon: 'zap', color: '#96CEB4' },
    {
      id: 'cat_entertainment',
      name: 'Entertainment',
      icon: 'film',
      color: '#FFEAA7',
    },
    {
      id: 'cat_shopping',
      name: 'Shopping',
      icon: 'shopping-bag',
      color: '#DDA0DD',
    },
    {
      id: 'cat_healthcare',
      name: 'Healthcare',
      icon: 'heart',
      color: '#FF8A80',
    },
    { id: 'cat_education', name: 'Education', icon: 'book', color: '#82B1FF' },
    {
      id: 'cat_personal',
      name: 'Personal Care',
      icon: 'user',
      color: '#EA80FC',
    },
    {
      id: 'cat_subscriptions',
      name: 'Subscriptions',
      icon: 'repeat',
      color: '#B388FF',
    },
    {
      id: 'cat_other_expense',
      name: 'Other',
      icon: 'more-horizontal',
      color: '#90A4AE',
    },
  ];

  const incomeCategories = [
    { id: 'cat_salary', name: 'Salary', icon: 'briefcase', color: '#66BB6A' },
    {
      id: 'cat_freelance',
      name: 'Freelance',
      icon: 'laptop',
      color: '#26A69A',
    },
    {
      id: 'cat_investment',
      name: 'Investment',
      icon: 'trending-up',
      color: '#42A5F5',
    },
    {
      id: 'cat_other_income',
      name: 'Other Income',
      icon: 'plus-circle',
      color: '#78909C',
    },
  ];

  for (const cat of expenseCategories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, is_default, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [cat.id, cat.name, cat.icon, cat.color, 'expense', expenseCategories.indexOf(cat)],
    );
  }

  for (const cat of incomeCategories) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, type, is_default, sort_order) VALUES (?, ?, ?, ?, ?, 1, ?)',
      [cat.id, cat.name, cat.icon, cat.color, 'income', incomeCategories.indexOf(cat)],
    );
  }
}

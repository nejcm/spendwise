/**
 * In-memory SQLite database for Jest tests.
 *
 * Wraps `better-sqlite3` (Node.js, synchronous) behind the same async interface
 * that `expo-sqlite` exposes so that query functions can be tested without
 * running on a real device.
 */
import Database from 'better-sqlite3';

export type TestDb = ReturnType<typeof createTestDb>;

function asyncify<T>(fn: () => T): Promise<T> {
  try {
    return Promise.resolve(fn());
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/** Create an in-memory SQLite database with the expo-sqlite async API shape. */
export function createTestDb(schema: string) {
  const db = new Database(':memory:');
  db.exec(schema);

  const wrapper = {
    /** Run a statement that returns nothing (INSERT / UPDATE / DELETE). */
    runAsync(sql: string, params: unknown[] = []): Promise<void> {
      return asyncify(() => {
        db.prepare(sql).run(params);
      });
    },

    /** Execute one or more raw SQL statements (no parameters). */
    execAsync(sql: string): Promise<void> {
      return asyncify(() => {
        db.exec(sql);
      });
    },

    /** Return the first matching row or null. */
    getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      return asyncify(() => (db.prepare(sql).get(params) as T) ?? null);
    },

    /** Return all matching rows. */
    getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      return asyncify(() => db.prepare(sql).all(params) as T[]);
    },

    /**
     * Wrap a callback in a transaction.
     * In tests we skip the actual transaction wrapper because better-sqlite3
     * transactions are synchronous while our async promises are not – in tests
     * atomicity guarantees are not required.
     */
    withTransactionAsync(cb: () => Promise<void>): Promise<void> {
      return cb();
    },

    /** Direct access to the underlying better-sqlite3 instance for seeding. */
    _raw: db,
  };

  return wrapper;
}

// ─── Shared schema (mirrors src/lib/sqlite/migrations.ts v1) ───

export const BASE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cash',
    currency TEXT NOT NULL DEFAULT 'EUR',
    icon TEXT,
    color TEXT,
    is_archived INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 999999,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT NOT NULL DEFAULT '#000000',
    sort_order INTEGER NOT NULL DEFAULT 999999,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    category_id TEXT,
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

  CREATE TABLE IF NOT EXISTS currency_rates (
    base TEXT NOT NULL,
    quote TEXT NOT NULL,
    rate REAL NOT NULL,
    date INTEGER NOT NULL,
    PRIMARY KEY (base, quote, date)
  );
`;

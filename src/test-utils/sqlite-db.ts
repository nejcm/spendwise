/**
 * In-memory SQLite database for Jest tests.
 *
 * Wraps `better-sqlite3` (Node.js, synchronous) behind the same async interface
 * that `expo-sqlite` exposes so that query functions can be tested without
 * running on a real device.
 *
 * Schema is applied via the real `migrateDb` function so it stays in sync with
 * production automatically. Seeded rows are cleared so each call starts clean.
 */
import Database from 'better-sqlite3';

import { clearDbData } from '@/lib/sqlite/db';
import { migrateDb } from '@/lib/sqlite/migrations';

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

function asyncify<T>(fn: () => T): Promise<T> {
  try {
    return Promise.resolve(fn());
  }
  catch (e) {
    return Promise.reject(e);
  }
}

/** Create an in-memory SQLite database with the expo-sqlite async API shape. */
export async function createTestDb() {
  const sqlite = new Database(':memory:');

  const db = {
    /** Run a statement that returns nothing (INSERT / UPDATE / DELETE). */
    runAsync(sql: string, params: unknown[] = []): Promise<void> {
      return asyncify(() => {
        sqlite.prepare(sql).run(params);
      });
    },

    /** Execute one or more raw SQL statements (no parameters). */
    execAsync(sql: string): Promise<void> {
      return asyncify(() => {
        sqlite.exec(sql);
      });
    },

    /** Return the first matching row or null. */
    getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      return asyncify(() => (sqlite.prepare(sql).get(params) as T) ?? null);
    },

    /** Return all matching rows. */
    getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      return asyncify(() => sqlite.prepare(sql).all(params) as T[]);
    },

    /**
     * Wrap a callback in a transaction.
     * better-sqlite3 transactions are synchronous so we simply await the async
     * callback directly — atomicity guarantees are not required in unit tests.
     */
    withTransactionAsync(cb: () => Promise<void>): Promise<void> {
      return cb();
    },

    /** Direct access to the underlying better-sqlite3 instance for seeding. */
    _raw: sqlite,
  };

  // Apply the real schema + bundled seeds, then wipe seeded rows so each test
  // starts with empty tables.
  await migrateDb(db as any);
  await clearDbData(db as any);

  return db;
}

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
    runAsync(sql: string, params: unknown[] = []): Promise<{ changes: number }> {
      return asyncify(() => ({ changes: sqlite.prepare(sql).run(params).changes }));
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

    /** Same BEGIN/COMMIT/ROLLBACK sequence as expo-sqlite, so interleaving bugs reproduce. */
    async withTransactionAsync(cb: () => Promise<void>): Promise<void> {
      try {
        sqlite.exec('BEGIN');
        await cb();
        sqlite.exec('COMMIT');
      }
      catch (e) {
        if (sqlite.inTransaction) sqlite.exec('ROLLBACK');
        throw e;
      }
    },

    isInTransactionAsync(): Promise<boolean> {
      return Promise.resolve(sqlite.inTransaction);
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

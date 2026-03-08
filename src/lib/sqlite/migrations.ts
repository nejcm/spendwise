import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

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

  await db.execAsync("PRAGMA journal_mode = 'wal'");
  await db.execAsync('PRAGMA foreign_keys = ON');

  if (currentDbVersion === 0) {
    // Initial schema – extend with your tables
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS _meta (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
  }

  // Add more migrations as needed:
  // if (currentDbVersion === 1) { ... }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

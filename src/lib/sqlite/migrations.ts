import { Platform } from 'react-native';

import { db } from '@/lib/drizzle/db';

/**
 * Drops all tables. Safe on all platforms.
 * Prefer this over deleteDatabaseAsync on web — that API has a bug where
 * it removes the file from the VFS path map but doesn't return the handle
 * to the available pool, causing SQLITE_CANTOPEN (14) on the next open
 * within the same Worker session.
 */
export async function dropDb(): Promise<void> {
  await db.$client.execAsync(`
    DROP TABLE IF EXISTS __drizzle_migrations;
    DROP TABLE IF EXISTS _meta;
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS budget_lines;
    DROP TABLE IF EXISTS budgets;
    DROP TABLE IF EXISTS recurring_rules;
    DROP TABLE IF EXISTS goals;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS accounts;
  `);
}

/**
 * Drops all tables and reloads on web so the Worker reinitialises its VFS state.
 * On native the app should be restarted to re-run migrations.
 */
export async function resetDb(): Promise<void> {
  await dropDb();
  if (Platform.OS === 'web') {
    window.location.reload();
  }
}

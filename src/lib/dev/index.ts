import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';
import { IS_WEB } from '../base';
import { dropDb, migrateDb } from '../sqlite';
import { clearDbData } from '../sqlite/migrations';
import { mockData } from '../sqlite/mock-data';
import { seedDefaults } from '../sqlite/seed';
import { clearAppStore } from '../store';

export async function clearData(db: SQLiteDatabase, queryClient: QueryClient) {
  try {
    await clearDbData(db);
    console.info('Database cleared successfully');
  }
  catch (err) {
    console.error('Failed to clear database', err);
  }
  clearAppStore();
  queryClient.clear();
  queryClient.invalidateQueries();
}

export async function seedData(db: SQLiteDatabase, queryClient: QueryClient) {
  try {
    await seedDefaults(db);
    queryClient.clear();
    queryClient.invalidateQueries();
    console.info('Database seeded successfully');
  }
  catch (err) {
    console.error('Failed to seed database', err);
  }
}

export async function seedMockData(db: SQLiteDatabase, queryClient: QueryClient) {
  try {
    await seedDefaults(db);
    await mockData(db);
    console.info('Mock data import successfully');
  }
  catch (err) {
    console.error('Failed to import mock data', err);
  }
  queryClient.clear();
  queryClient.invalidateQueries();
}

export async function dumpDbTables(db: SQLiteDatabase) {
  try {
    const tables = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;`,
    );

    const tableNames = tables.map((t) => t.name);
    console.info('[db] tables', tableNames);
  }
  catch (err) {
    console.error('Failed to dump DB tables', err);
  }
}

/**
 * Drops all tables and recreates them. Safe on all platforms.
 * Prefer this over deleteDatabaseAsync on web — that API has a bug where
 * it removes the file from the VFS path map but doesn't return the handle
 * to the available pool, causing SQLITE_CANTOPEN (14) on the next open
 * within the same Worker session.
 */
export async function resetDb(db: SQLiteDatabase, queryClient?: QueryClient | null): Promise<void> {
  await dropDb(db);
  await migrateDb(db);
  if (queryClient) {
    queryClient.clear();
    queryClient.invalidateQueries();
  }
  if (IS_WEB) {
    // Reload the page so the Worker reinitialises its VFS state cleanly.
    window.location.reload();
  }
}

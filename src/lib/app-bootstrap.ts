import type { SQLiteDatabase } from 'expo-sqlite';

import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { ensureAndroidChannel } from '@/features/notifications/notifications';
import { migrateDb } from '@/lib/sqlite';
import { logger } from './logger';

const BOOTSTRAP_TIMEOUT_MS = 15_000;

/**
 * Sequenced app startup after SQLite opens. Must stay offline: scheduled sync can
 * fetch currency rates, so it runs in `ScheduledTransactionsProcessor` after mount.
 *
 * Races against a timeout so a hanging migration surfaces as a catchable error
 * instead of freezing the splash screen.
 */
export async function bootstrapApp(db: SQLiteDatabase): Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      bootstrapAppInternal(db),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('[bootstrap] timed out after 15 s')),
          BOOTSTRAP_TIMEOUT_MS,
        );
      }),
    ]);
    await SplashScreen.hideAsync();
  }
  finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

async function bootstrapAppInternal(db: SQLiteDatabase): Promise<void> {
  logger.withEnv('production')?.info('[bootstrap] starting...');
  try {
    await migrateDb(db);
    logger.withEnv('production')?.info('[bootstrap] migrations complete');
  }
  catch (e) {
    logger.withEnv('production')?.error('[bootstrap] migration failed', e);
    throw e;
  }

  try {
    await ensureAndroidChannel();
    logger.withEnv('production')?.info('[bootstrap] post-migration tasks complete');
  }
  catch (e) {
    logger.withEnv('production')?.error('[bootstrap] post-migration task failed', e);
    throw e;
  }
}

/** `SQLiteProvider` `onInit` handler. */
export function useAppBootstrapOnInit(): (db: SQLiteDatabase) => Promise<void> {
  return useCallback((db: SQLiteDatabase) => bootstrapApp(db), []);
}

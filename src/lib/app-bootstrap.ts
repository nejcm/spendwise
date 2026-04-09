import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useQueryClient } from '@tanstack/react-query';

import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { ensureAndroidChannel } from '@/features/notifications/notifications';
import { syncDueScheduledTransactions } from '@/features/scheduled-transactions/api';
import { migrateDb } from '@/lib/sqlite';

const BOOTSTRAP_TIMEOUT_MS = 15_000;

/**
 * Sequenced app startup after SQLite opens. Pass a `QueryClient` so cache
 * invalidation after scheduled sync is testable and explicit.
 *
 * Races against a timeout so a hanging migration or network call
 * surfaces as a catchable error instead of freezing the splash screen.
 */
export async function bootstrapApp(
  db: SQLiteDatabase,
  queryClient: QueryClient,
): Promise<void> {
  await Promise.race([
    bootstrapAppInternal(db, queryClient),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('[bootstrap] timed out after 15 s')),
        BOOTSTRAP_TIMEOUT_MS,
      ),
    ),
  ]);
  SplashScreen.hide();
}

async function bootstrapAppInternal(
  db: SQLiteDatabase,
  queryClient: QueryClient,
): Promise<void> {
  console.log('[bootstrap] starting migrations');
  try {
    await migrateDb(db);
    console.log('[bootstrap] migrations complete');
  }
  catch (e) {
    console.error('[bootstrap] migration failed', e);
    throw e;
  }

  console.log('[bootstrap] running post-migration tasks');
  try {
    await Promise.all([
      ensureAndroidChannel(),
      syncDueScheduledTransactions(db, queryClient),
    ]);
    console.log('[bootstrap] post-migration tasks complete');
  }
  catch (e) {
    console.error('[bootstrap] post-migration task failed', e);
    throw e;
  }
}

/**
 * `SQLiteProvider` `onInit` handler when this hook runs under `QueryClientProvider`.
 */
export function useAppBootstrapOnInit(): (db: SQLiteDatabase) => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback((db: SQLiteDatabase) => bootstrapApp(db, queryClient), [queryClient]);
}

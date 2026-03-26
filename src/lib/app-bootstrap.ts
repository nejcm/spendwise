import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { ensureAndroidChannel } from '@/features/notifications/notifications';
import { syncDueScheduledTransactions } from '@/features/scheduled-transactions/api';
import { migrateDb } from '@/lib/sqlite';

/**
 * Sequenced app startup after SQLite opens. Pass a `QueryClient` so cache
 * invalidation after scheduled sync is testable and explicit.
 */
export async function bootstrapApp(
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

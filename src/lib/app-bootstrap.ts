import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  checkUpcomingBills,
  setupNotifications,
} from '@/features/notifications/notifications';
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
  await migrateDb(db);
  await setupNotifications();
  await syncDueScheduledTransactions(db, queryClient);
  await checkUpcomingBills(db);
}

/**
 * `SQLiteProvider` `onInit` handler when this hook runs under `QueryClientProvider`.
 */
export function useAppBootstrapOnInit(): (db: SQLiteDatabase) => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback((db: SQLiteDatabase) => bootstrapApp(db, queryClient), [queryClient]);
}

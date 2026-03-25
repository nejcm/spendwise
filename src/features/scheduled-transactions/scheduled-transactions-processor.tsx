import { useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { AppState } from 'react-native';
import { todayISO } from '@/features/formatting/helpers';
import { runAllNotificationChecks } from '@/features/notifications/notifications';
import { getAppState } from '@/lib/store';
import { syncDueScheduledTransactions } from './api';

export function ScheduledTransactionsProcessor() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const isProcessingRef = React.useRef(false);
  const lastProcessedDateRef = React.useRef<string | null>(null);

  const processSchedules = React.useCallback(async () => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    try {
      await syncDueScheduledTransactions(db, queryClient);
      await runAllNotificationChecks(db, getAppState().notifications);
      lastProcessedDateRef.current = todayISO();
    }
    finally {
      isProcessingRef.current = false;
    }
  }, [db, queryClient]);

  React.useEffect(() => {
    void processSchedules();
  }, [processSchedules]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && lastProcessedDateRef.current !== todayISO()) {
        void processSchedules();
      }
    });

    return () => subscription.remove();
  }, [processSchedules]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (lastProcessedDateRef.current !== todayISO()) {
        void processSchedules();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [processSchedules]);

  return null;
}

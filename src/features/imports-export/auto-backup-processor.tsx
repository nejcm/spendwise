import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { AppState } from 'react-native';
import { IS_AUTO_BACKUP_SUPPORTED, shouldRunAutoBackup, writeAutoBackupFile } from '@/features/imports-export/backup-file';
import { getAppState, updateAutoBackup } from '@/lib/store';

export function AutoBackupProcessor() {
  const db = useSQLiteContext();
  const isRunningRef = React.useRef(false);

  const maybeBackup = React.useCallback(async () => {
    if (!IS_AUTO_BACKUP_SUPPORTED) return;

    const { autoBackup } = getAppState();
    if (!autoBackup.enabled) return;
    if (!shouldRunAutoBackup(autoBackup.lastAutoBackupAt, autoBackup.interval)) return;
    if (isRunningRef.current) return;

    isRunningRef.current = true;
    try {
      const { writtenAt } = await writeAutoBackupFile(db);
      updateAutoBackup({ lastAutoBackupAt: writtenAt });
    }
    catch {
      /* ignore */
    }
    finally {
      isRunningRef.current = false;
    }
  }, [db]);

  React.useEffect(() => {
    void maybeBackup();
  }, [maybeBackup]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void maybeBackup();
    });
    return () => subscription.remove();
  }, [maybeBackup]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      void maybeBackup();
    }, 60_000);
    return () => clearInterval(interval);
  }, [maybeBackup]);

  return null;
}

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { IS_WEB } from '../base';

// eslint-disable-next-line react-refresh/only-export-components
export const OPFS_CLEAR_FLAG = 'spendwise_clearOpfs';

async function doOpfsClear(): Promise<void> {
  if (typeof navigator?.storage?.getDirectory !== 'function') return;
  const root = await navigator.storage.getDirectory();
  await root.removeEntry('expo-sqlite', { recursive: true }).catch(() => {});
}

// Two-phase OPFS recovery:
// Phase 1 (DatabaseErrorBoundary): set flag in sessionStorage and reload.
//   The reload terminates the SQLite Web Worker, releasing its exclusive
//   FileSystemSyncAccessHandles so removeEntry can succeed.
// Phase 2 (OpfsCleaner): on the next page load, before SQLiteProvider mounts,
//   detect the flag and clear the OPFS directory, then reload once more.
// Phase 3: clean page load with fresh OPFS.
export function OpfsCleaner({ children }: { children: React.ReactNode }) {
  const needsClear = IS_WEB
    && typeof sessionStorage !== 'undefined'
    && sessionStorage.getItem(OPFS_CLEAR_FLAG) === '1';

  const [done] = useState(!needsClear);

  useEffect(() => {
    if (done) return;
    doOpfsClear().finally(() => {
      sessionStorage.removeItem(OPFS_CLEAR_FLAG);
      window.location.reload();
    });
  }, [done]);

  if (!done) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#666' }}>Clearing database storage…</Text>
      </View>
    );
  }
  return <>{children}</>;
}

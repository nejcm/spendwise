import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { LockScreen } from '@/features/security/lock-screen';
import { setLockEnabled, useAppStore } from '@/lib/store';

export function SecurityLock() {
  const isLocked = useAppStore.use.lockEnabled();
  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundTimeRef.current = Date.now();
      }
      else if (state === 'active') {
        if (!useAppStore.getState().lockEnabled) return;
        const ms = useAppStore.getState().lockTimeoutMinutes * 60 * 1000;
        const elapsed
          = backgroundTimeRef.current !== null ? Date.now() - backgroundTimeRef.current : Infinity;
        if (elapsed >= ms) {
          setLockEnabled(true);
        }
      }
    });
    return () => sub.remove();
  }, []);

  return <LockScreen visible={isLocked} onUnlock={() => setLockEnabled(false)} />;
}

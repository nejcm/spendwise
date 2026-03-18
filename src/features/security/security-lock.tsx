import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { LockScreen } from '@/features/security/lock-screen';
import { setIsLocked, useAppStore } from '@/lib/store';

export function SecurityLock() {
  const lockEnabled = useAppStore.use.lockEnabled();
  const isLocked = useAppStore.use.isLocked();
  const backgroundTimeRef = useRef<number | null>(null);

  // Lock on app launch if feature is enabled
  useEffect(() => {
    const lockEnabledState = useAppStore.getState().lockEnabled;
    if (lockEnabledState) {
      setIsLocked(true);
    }
  }, []); // intentionally run only on mount

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      // Only record on 'background' — NOT 'inactive'.
      // On iOS, 'inactive' fires during Face ID scans, notification center
      // pull-downs, and other transient overlays that are not real backgrounding.
      if (state === 'background') {
        backgroundTimeRef.current = Date.now();
      }
      else if (state === 'active') {
        if (!useAppStore.getState().lockEnabled) return;
        const ms = useAppStore.getState().lockTimeoutMinutes * 60 * 1000;
        const elapsed
          = backgroundTimeRef.current !== null ? Date.now() - backgroundTimeRef.current : Infinity;
        if (elapsed >= ms) {
          setIsLocked(true);
        }
      }
    });
    return () => sub.remove();
  }, []);

  const handleUnlock = useCallback(() => {
    backgroundTimeRef.current = null;
    setIsLocked(false);
  }, []);

  if (!lockEnabled) return null;

  return <LockScreen visible={isLocked} onUnlock={handleUnlock} />;
}

import { storage } from '@/lib/storage';

const KEYS = {
  LOCK_ENABLED: 'security.lock_enabled',
  LOCK_TIMEOUT: 'security.lock_timeout_minutes',
} as const;

export function isLockEnabled(): boolean {
  return storage.getString(KEYS.LOCK_ENABLED) === 'true';
}

export function setLockEnabled(enabled: boolean): void {
  storage.set(KEYS.LOCK_ENABLED, enabled ? 'true' : 'false');
}

export function getLockTimeoutMinutes(): number {
  const val = storage.getString(KEYS.LOCK_TIMEOUT);
  return val !== undefined ? Number.parseInt(val, 10) : 1;
}

export function setLockTimeoutMinutes(minutes: number): void {
  storage.set(KEYS.LOCK_TIMEOUT, String(minutes));
}

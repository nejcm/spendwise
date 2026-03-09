import { storage } from '@/lib/storage';

const KEYS = {
  BIOMETRIC_ENABLED: 'security.biometric_enabled',
  LOCK_TIMEOUT: 'security.lock_timeout_minutes',
  PIN: 'security.pin',
  PIN_ENABLED: 'security.pin_enabled',
} as const;

export function getStoredPin(): string | null {
  return storage.getString(KEYS.PIN) ?? null;
}

export function setStoredPin(pin: string): void {
  storage.set(KEYS.PIN, pin);
  storage.set(KEYS.PIN_ENABLED, 'true');
}

export function clearStoredPin(): void {
  storage.remove(KEYS.PIN);
  storage.set(KEYS.PIN_ENABLED, 'false');
  storage.set(KEYS.BIOMETRIC_ENABLED, 'false');
}

export function isPinEnabled(): boolean {
  return storage.getString(KEYS.PIN_ENABLED) === 'true';
}

export function isBiometricEnabled(): boolean {
  return storage.getString(KEYS.BIOMETRIC_ENABLED) === 'true';
}

export function setBiometricEnabled(enabled: boolean): void {
  storage.set(KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
}

export function getLockTimeoutMinutes(): number {
  const val = storage.getString(KEYS.LOCK_TIMEOUT);
  return val !== undefined ? Number.parseInt(val, 10) : 1;
}

export function setLockTimeoutMinutes(minutes: number): void {
  storage.set(KEYS.LOCK_TIMEOUT, String(minutes));
}

export function verifyPin(pin: string): boolean {
  const stored = getStoredPin();
  return stored !== null && stored === pin;
}

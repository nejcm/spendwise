import * as LocalAuthentication from 'expo-local-authentication';
import { clearAppStore, setIsLocked, setLockEnabled, useAppStore } from '@/lib/store/store';
import { toggleAppLock } from './app-lock';

jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_STRONG: 3 },
  authenticateAsync: jest.fn(),
  getEnrolledLevelAsync: jest.fn(),
  hasHardwareAsync: jest.fn(),
}));

const auth = jest.mocked(LocalAuthentication);
function lockState() {
  const { isLocked, lockEnabled } = useAppStore.getState();
  return { isLocked, lockEnabled };
}

describe('toggleAppLock', () => {
  beforeEach(() => {
    clearAppStore();
    jest.clearAllMocks();
    auth.hasHardwareAsync.mockResolvedValue(true);
    auth.getEnrolledLevelAsync.mockResolvedValue(LocalAuthentication.SecurityLevel.SECRET);
  });

  it('turns the lock on when the device has a lock set up', async () => {
    await toggleAppLock(true);

    expect(lockState()).toEqual({ isLocked: false, lockEnabled: true });
  });

  it.each([
    ['no auth hardware', (): void => { auth.hasHardwareAsync.mockResolvedValue(false); }],
    ['no device lock enrolled', (): void => { auth.getEnrolledLevelAsync.mockResolvedValue(LocalAuthentication.SecurityLevel.NONE); }],
  ])('keeps the lock off with %s', async (_case: string, arrange: () => void) => {
    arrange();

    await toggleAppLock(true);

    expect(lockState().lockEnabled).toBe(false);
  });

  it('turning off after a passing auth disables the lock and clears the lock gate', async () => {
    setLockEnabled(true);
    setIsLocked(true);
    auth.authenticateAsync.mockResolvedValue({ success: true });

    await toggleAppLock(false);

    expect(lockState()).toEqual({ isLocked: false, lockEnabled: false });
  });

  it('turning off after a failed auth leaves the lock and gate in place', async () => {
    setLockEnabled(true);
    setIsLocked(true);
    auth.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });

    await toggleAppLock(false);

    expect(lockState()).toEqual({ isLocked: true, lockEnabled: true });
  });
});

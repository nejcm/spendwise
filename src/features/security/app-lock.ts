import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from '@/components/ui';
import { translateCount } from '@/features/categories/helpers';
import { translate } from '@/lib/i18n';
import { setIsLocked, setLockEnabled } from '@/lib/store/store';

export const LOCK_TIMEOUT_MINUTES = [0, 1, 3, 5, 15, 30, 60];

export function lockTimeoutLabel(minutes: number) {
  if (minutes === 0) return translate('security.timeout_immediately');
  return minutes % 60 === 0
    ? translateCount('security.timeout_hours', minutes / 60)
    : translateCount('security.timeout_minutes', minutes);
}

/** Turning the lock off needs a passing device auth and clears the lock gate too. */
export async function toggleAppLock(on: boolean) {
  if (!on) {
    const result = await LocalAuthentication.authenticateAsync({
      cancelLabel: translate('common.cancel'),
      disableDeviceFallback: false,
      promptMessage: translate('security.verify_to_disable'),
    });
    if (result.success) {
      setLockEnabled(false);
      setIsLocked(false);
    }
    return;
  }
  if (!(await LocalAuthentication.hasHardwareAsync())) {
    Alert.alert(translate('security.no_hardware_title'), translate('security.no_hardware_desc'));
    return;
  }
  if (await LocalAuthentication.getEnrolledLevelAsync() === LocalAuthentication.SecurityLevel.NONE) {
    Alert.alert(translate('security.no_device_lock_title'), translate('security.no_device_lock_desc'));
    return;
  }
  setLockEnabled(true);
}

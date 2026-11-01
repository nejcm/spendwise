import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { setIsLocked, setLockEnabled } from '@/lib/store/store';

export const LOCK_TIMEOUT_OPTIONS = [
  { label: translate('security.timeout_immediately'), value: 0 },
  { label: '1 min', value: 1 },
  { label: '3 min', value: 3 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
];

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

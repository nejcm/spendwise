import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-native';

import { SafeAreaView, SolidButton, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { config } from '../../config';

type Props = {
  onUnlock: () => void;
  visible: boolean;
};

export function LockScreen({ visible, onUnlock }: Props) {
  const [hint, setHint] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    setHint(null);
    const result = await LocalAuthentication.authenticateAsync({
      cancelLabel: translate('common.cancel'),
      disableDeviceFallback: false,
      promptMessage: translate('security.unlock_prompt'),
    });
    if (result.success) {
      onUnlock();
    }
    else if (result.error === 'user_cancel' || result.error === 'system_cancel') {
      setHint(translate('security.tap_to_unlock'));
    }
    else {
      setHint(translate('security.auth_failed'));
    }
  }, [onUnlock]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible) void authenticate();
  }, [visible, authenticate]);

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <Text className="mb-2 text-3xl font-bold">{config.appName}</Text>
        <Text className="mb-12 text-gray-500">{translate('security.locked')}</Text>
        {hint !== null && (
          <Text className="mb-4 text-sm text-gray-400">{hint}</Text>
        )}
        <SolidButton label={translate('security.unlock')} onPress={authenticate} />
      </SafeAreaView>
    </Modal>
  );
}

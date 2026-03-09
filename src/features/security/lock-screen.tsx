import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { Modal, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Props = {
  onUnlock: () => void;
  visible: boolean;
};

export function LockScreen({ visible, onUnlock }: Props) {
  const authenticate = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      cancelLabel: translate('common.cancel'),
      disableDeviceFallback: false,
      promptMessage: translate('security.unlock_prompt'),
    });
    if (result.success) onUnlock();
  }, [onUnlock]);

  useEffect(() => {
    if (visible) {
      void authenticate();
    }
  }, [visible, authenticate]);

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <Text className="mb-2 text-3xl font-bold">Spendwise</Text>
        <Text className="mb-12 text-neutral-500">{translate('security.locked')}</Text>
        <Button label={translate('security.unlock')} onPress={authenticate} />
      </View>
    </Modal>
  );
}

import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { PinPad } from './components/pin-pad';
import { isBiometricEnabled, verifyPin } from './use-security';

type Props = {
  onUnlock: () => void;
  visible: boolean;
};

export function LockScreen({ visible, onUnlock }: Props) {
  const [hasError, setHasError] = useState(false);
  const biometric = isBiometricEnabled();

  const tryBiometric = useCallback(async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !enrolled) {
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      cancelLabel: translate('common.cancel'),
      promptMessage: translate('security.biometric_prompt'),
    });
    if (result.success) {
      onUnlock();
    }
  }, [onUnlock]);

  useEffect(() => {
    if (visible && biometric) {
      void tryBiometric();
    }
  }, [visible, biometric, tryBiometric]);

  const handleComplete = (pin: string) => {
    if (verifyPin(pin)) {
      onUnlock();
    }
    else {
      setHasError(true);
      setTimeout(setHasError, 600, false);
    }
  };

  return (
    <Modal animationType="fade" statusBarTranslucent transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-900">
        <Text className="mb-2 text-2xl font-bold">{translate('security.enter_pin')}</Text>
        <View className="mb-4 h-5">
          {hasError && (
            <Text className="text-sm text-red-500">{translate('security.wrong_pin')}</Text>
          )}
        </View>

        <PinPad
          hasError={hasError}
          label={translate('security.enter_pin_label')}
          onComplete={handleComplete}
        />

        {biometric && (
          <Pressable className="mt-8" onPress={tryBiometric}>
            <Text className="text-base text-primary-500">
              {translate('security.use_biometric')}
            </Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

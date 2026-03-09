import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';
import { useState } from 'react';
import { Alert, Pressable, Switch, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import {
  getLockTimeoutMinutes,
  isLockEnabled,
  setLockEnabled,
  setLockTimeoutMinutes,
} from './use-security';

const TIMEOUT_OPTIONS = [
  { label: translate('security.timeout_immediately'), value: 0 },
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
];

export function SecuritySettingsScreen() {
  const [lockEnabledState, setLockEnabledState] = useState(() => isLockEnabled());
  const [timeoutVal, setTimeoutVal] = useState(() => getLockTimeoutMinutes());

  const handleToggleLock = async () => {
    if (lockEnabledState) {
      const result = await LocalAuthentication.authenticateAsync({
        cancelLabel: translate('common.cancel'),
        disableDeviceFallback: false,
        promptMessage: translate('security.verify_to_disable'),
      });
      if (result.success) {
        setLockEnabled(false);
        setLockEnabledState(false);
      }
    }
    else {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          translate('security.no_device_lock_title'),
          translate('security.no_device_lock_desc'),
        );
        return;
      }
      setLockEnabled(true);
      setLockEnabledState(true);
    }
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="mb-6 rounded-xl bg-neutral-50 dark:bg-neutral-800">
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-1">
              <Text className="font-medium">{translate('security.app_lock')}</Text>
              <Text className="text-sm text-neutral-500">{translate('security.app_lock_desc')}</Text>
            </View>
            <Switch
              value={lockEnabledState}
              onValueChange={() => {
                void handleToggleLock();
              }}
            />
          </View>
        </View>

        {lockEnabledState && (
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {translate('security.lock_after')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TIMEOUT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  className={`rounded-full px-4 py-2 ${
                    timeoutVal === opt.value ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'
                  }`}
                  onPress={() => {
                    setLockTimeoutMinutes(opt.value);
                    setTimeoutVal(opt.value);
                  }}
                >
                  <Text
                    className={`text-sm font-medium ${timeoutVal === opt.value ? 'text-white' : ''}`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

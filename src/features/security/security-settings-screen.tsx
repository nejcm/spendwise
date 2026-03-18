import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';
import { Pressable } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Switch, Text, View } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { translate } from '@/lib/i18n';
import { setLockEnabled, setLockTimeoutMinutes, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import DetailsSection from '../../components/details';

const TIMEOUT_OPTIONS = [
  { label: translate('security.timeout_immediately'), value: 0 },
  { label: '1 min', value: 1 },
  { label: '3 min', value: 3 },
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
];

export function SecuritySettingsScreen() {
  const lockEnabled = useAppStore.use.lockEnabled();
  const timeoutVal = useAppStore.use.lockTimeoutMinutes();

  const handleToggleLock = async (on: boolean) => {
    if (!on) {
      const result = await LocalAuthentication.authenticateAsync({
        cancelLabel: translate('common.cancel'),
        disableDeviceFallback: false,
        promptMessage: translate('security.verify_to_disable'),
      });
      if (result.success) {
        setLockEnabled(on);
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
      setLockEnabled(on);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        <DetailsSection data={[{
          label: translate('security.app_lock'),
          description: translate('security.app_lock_desc'),
          value: (
            <Switch
              checked={lockEnabled}
              onChange={(checked) => {
                void handleToggleLock(checked);
              }}
              accessibilityLabel={translate('security.app_lock')}
            />
          ),
        }]}
        />

        {lockEnabled && (
          <View className="mb-6">
            <Text className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              {translate('security.lock_after')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {TIMEOUT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  className={`rounded-full px-4 py-2 ${
                    timeoutVal === opt.value ? 'bg-primary-400' : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                  onPress={() => {
                    setLockTimeoutMinutes(opt.value);
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

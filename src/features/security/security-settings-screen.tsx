import * as LocalAuthentication from 'expo-local-authentication';
import * as React from 'react';

import { Alert, FocusAwareStatusBar, ScrollView, Select, Switch, Text, View } from '@/components/ui';

import { translate } from '@/lib/i18n';
import { setIsLocked, setLockEnabled, setLockTimeoutMinutes, useAppStore } from '@/lib/store';
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
        setLockEnabled(false);
        setIsLocked(false);
      }
    }
    else {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert(
          translate('security.no_hardware_title'),
          translate('security.no_hardware_desc'),
        );
        return;
      }
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      if (level === LocalAuthentication.SecurityLevel.NONE) {
        Alert.alert(
          translate('security.no_device_lock_title'),
          translate('security.no_device_lock_desc'),
        );
        return;
      }
      setLockEnabled(true);
    }
  };

  return (
    <>
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
        >
          {lockEnabled && (
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-foreground">
                {translate('security.lock_after')}
              </Text>
              <View>
                <Select
                  options={TIMEOUT_OPTIONS}
                  value={timeoutVal}
                  containerClassName="min-w-32"
                  onSelect={(option) => {
                    setLockTimeoutMinutes(option);
                  }}
                />
              </View>
            </View>
          )}
        </DetailsSection>
      </ScrollView>
    </>
  );
}

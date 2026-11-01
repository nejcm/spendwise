import * as React from 'react';

import { FocusAwareStatusBar, ScrollView, Select, Switch, Text, View } from '@/components/ui';

import { translate } from '@/lib/i18n';
import { setLockTimeoutMinutes, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import DetailsSection from '../../components/details';
import { LOCK_TIMEOUT_OPTIONS, toggleAppLock } from './app-lock';

export function SecuritySettingsScreen() {
  const lockEnabled = useAppStore.use.lockEnabled();
  const timeoutVal = useAppStore.use.lockTimeoutMinutes();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4" style={defaultStyles.transparentBg}>
        <DetailsSection data={[{
          label: translate('security.app_lock'),
          description: translate('security.app_lock_desc'),
          value: (
            <Switch
              checked={lockEnabled}
              onChange={(checked) => {
                void toggleAppLock(checked);
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
                  options={LOCK_TIMEOUT_OPTIONS}
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

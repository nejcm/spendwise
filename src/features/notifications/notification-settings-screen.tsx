import * as React from 'react';
import { Alert, Platform, View } from 'react-native';

import { Button, FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { setupNotifications } from './notifications';

export function NotificationSettingsScreen() {
  const handleEnable = async () => {
    try {
      await setupNotifications();
      Alert.alert(
        translate('settings.notifications'),
        Platform.OS === 'ios'
          ? 'Notifications settings have been opened. You can manage permissions in the system dialog.'
          : 'Notification permissions have been requested. You can also adjust them in system settings.',
      );
    }
    catch {
      Alert.alert(translate('settings.notifications'), 'Unable to update notification settings.');
    }
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Enable notifications to get alerts about budgets nearing their limits and upcoming recurring bills.
        </Text>
        <Button
          label={translate('settings.notifications')}
          onPress={() => {
            void handleEnable();
          }}
        />
      </ScrollView>
    </View>
  );
}

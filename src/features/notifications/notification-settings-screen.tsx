import * as React from 'react';
import { Platform, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { translate } from '@/lib/i18n';

import { defaultStyles } from '@/lib/theme/styles';
import { setupNotifications } from './notifications';

export function NotificationSettingsScreen() {
  const handleEnable = async () => {
    try {
      await setupNotifications();
      Alert.alert(
        translate('settings.notifications'),
        Platform.OS === 'ios'
          ? translate('notifications.ios_opened')
          : translate('notifications.android_requested'),
      );
    }
    catch {
      Alert.alert(translate('settings.notifications'), translate('notifications.update_error'));
    }
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        <Text className="mb-4 text-sm text-muted-foreground">
          {translate('notifications.enable_description')}
        </Text>
        <SolidButton
          label={translate('settings.notifications')}
          onPress={() => {
            void handleEnable();
          }}
        />
      </ScrollView>
    </View>
  );
}

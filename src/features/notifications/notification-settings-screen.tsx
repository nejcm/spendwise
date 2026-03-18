import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { Platform, View } from 'react-native';
import { FocusAwareStatusBar, ScrollView, Switch } from '@/components/ui';
import Alert from '@/components/ui/alert';

import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import DetailsSection from '../../components/details';
import { updateNotifications, useAppStore } from '../../lib/store';
import { notificationsQuery, setupNotifications } from './notifications';

export function NotificationSettingsScreen() {
  const { data: canNotify } = useQuery(notificationsQuery);
  const storeEnabled = useAppStore.use.notifications();
  const enabled = !!canNotify && !!storeEnabled.global;

  const handleEnable = async (on: boolean) => {
    if (on) {
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
    }
    updateNotifications({ global: on });
  };

  return (
    <View className="bg-background flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        <DetailsSection data={[{
          label: translate('notifications.label'),
          labelClassName: 'text-foreground',
          description: translate('notifications.enable_description'),
          value: (
            <Switch
              accessibilityLabel={translate('notifications.label')}
              checked={enabled}
              onChange={(checked) => {
                void handleEnable(checked);
              }}
            />
          ),
        }]}
        />
      </ScrollView>
    </View>
  );
}

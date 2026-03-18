import { Stack } from 'expo-router';
import * as React from 'react';

import { NotificationSettingsScreen } from '@/features/notifications/notification-settings-screen';
import { translate } from '@/lib/i18n';

export default function NotificationsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.notifications'), headerShown: true }} />
      <NotificationSettingsScreen />
    </>
  );
}

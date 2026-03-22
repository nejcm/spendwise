import * as React from 'react';

import ScreenHeader from '@/components/screen-header';
import { NotificationSettingsScreen } from '@/features/notifications/notification-settings-screen';
import { translate } from '@/lib/i18n';

export default function NotificationsRoute() {
  return (
    <>
      <ScreenHeader title={translate('settings.notifications')} />
      <NotificationSettingsScreen />
    </>
  );
}

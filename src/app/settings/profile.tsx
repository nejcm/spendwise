import { Stack } from 'expo-router';
import * as React from 'react';

import { ProfileSettingsScreen } from '@/features/profile/profile-settings-screen';
import { translate } from '@/lib/i18n';

export default function ProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('settings.profile') }} />
      <ProfileSettingsScreen />
    </>
  );
}

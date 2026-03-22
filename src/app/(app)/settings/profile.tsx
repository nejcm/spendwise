import * as React from 'react';

import ScreenHeader from '@/components/screen-header';
import { ProfileSettingsScreen } from '@/features/profile/profile-settings-screen';
import { translate } from '@/lib/i18n';

export default function ProfileRoute() {
  return (
    <>
      <ScreenHeader title={translate('settings.profile')} />
      <ProfileSettingsScreen />
    </>
  );
}

import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { AppearanceSettingsScreen } from '@/features/settings/appearance-settings-screen';
import { translate } from '@/lib/i18n';

export default function AppearanceSettingsRoute() {
  return (
    <>
      <ScreenHeader title={translate('settings.appearance')} />
      <AppearanceSettingsScreen />
    </>
  );
}

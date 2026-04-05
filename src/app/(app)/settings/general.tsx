import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { GeneralSettingsScreen } from '@/features/settings/general-settings-screen';
import { translate } from '@/lib/i18n';

export default function GeneralSettingsRoute() {
  return (
    <>
      <ScreenHeader title={translate('settings.general')} />
      <GeneralSettingsScreen />
    </>
  );
}

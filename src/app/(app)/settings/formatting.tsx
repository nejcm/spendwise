import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { FormattingSettingsScreen } from '@/features/settings/formatting-settings-screen';
import { translate } from '@/lib/i18n';

export default function FormattingRoute() {
  return (
    <>
      <ScreenHeader title={translate('settings.formatting')} />
      <FormattingSettingsScreen />
    </>
  );
}

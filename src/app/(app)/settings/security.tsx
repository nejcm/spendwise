import * as React from 'react';

import ScreenHeader from '@/components/screen-header';
import { SecuritySettingsScreen } from '@/features/security/security-settings-screen';
import { translate } from '@/lib/i18n';

export default function SecurityRoute() {
  return (
    <>
      <ScreenHeader title={translate('security.title')} />
      <SecuritySettingsScreen />
    </>
  );
}

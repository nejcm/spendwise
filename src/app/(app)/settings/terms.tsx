import * as React from 'react';

import ScreenHeader from '@/components/screen-header';
import { TermsScreen } from '@/features/settings/terms-screen';
import { translate } from '@/lib/i18n';

export default function TermsRoute() {
  return (
    <>
      <ScreenHeader title={translate('settings.terms')} />
      <TermsScreen />
    </>
  );
}

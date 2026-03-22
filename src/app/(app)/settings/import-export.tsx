import * as React from 'react';

import ScreenHeader from '@/components/screen-header';
import { ImportScreen } from '@/features/imports-export/import-export-screen';
import { translate } from '@/lib/i18n';

export default function ImportRoute() {
  return (
    <>
      <ScreenHeader title={translate('import-export.title')} />
      <ImportScreen />
    </>
  );
}

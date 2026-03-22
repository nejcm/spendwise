import * as React from 'react';

import { AiSettingsScreen } from '@/features/ai/ai-settings-screen';
import ScreenHeader from '../../../components/screen-header';

export default function AiSettingsRoute() {
  return (
    <>
      <ScreenHeader title="AI" />
      <AiSettingsScreen />
    </>
  );
}

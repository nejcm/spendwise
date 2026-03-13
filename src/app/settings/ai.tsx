import { Stack } from 'expo-router';
import * as React from 'react';

import { AiSettingsScreen } from '@/features/ai/ai-settings-screen';

export default function AiSettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: 'AI' }} />
      <AiSettingsScreen />
    </>
  );
}


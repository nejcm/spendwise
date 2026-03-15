import { Stack } from 'expo-router';
import * as React from 'react';

import { AiScreen } from '@/features/ai/ai-screen';

export default function AiRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AiScreen />
    </>
  );
}

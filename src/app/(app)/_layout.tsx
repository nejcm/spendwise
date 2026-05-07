import { Redirect, Stack } from 'expo-router';
import * as React from 'react';

import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '@/lib/theme/use-theme-config';

export default function AppLayout() {
  const theme = useThemeConfig();
  const isFirstTime = useAppStore.use.isFirstTime();

  if (isFirstTime) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: theme.dark ? defaultStyles.backgroundDark : defaultStyles.background,
    }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="categories/new" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="categories/[id]/edit" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="stats" />
      <Stack.Screen name="stats/global-budget" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="transactions/new" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="transactions/[id]" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="accounts/new" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="accounts/[id]" />
      <Stack.Screen name="accounts/[id]/edit" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="ai" />
      <Stack.Screen name="scheduled/index" />
      <Stack.Screen name="scheduled/new" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="scheduled/[id]" />
      <Stack.Screen name="settings/profile" />
      <Stack.Screen name="settings/general" />
      <Stack.Screen name="settings/ai" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/security" />
      <Stack.Screen name="settings/formatting" />
      <Stack.Screen name="settings/import-export" />
      <Stack.Screen name="settings/privacy" />
      <Stack.Screen name="settings/terms" />
    </Stack>
  );
}

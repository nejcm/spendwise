import { Redirect, SplashScreen, Stack } from 'expo-router';
import * as React from 'react';

import { useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '@/lib/theme/use-theme-config';

export default function AppLayout() {
  const theme = useThemeConfig();
  const isFirstTime = useAppStore.use.isFirstTime();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      hideSplash();
    }, 1000);
    return () => clearTimeout(timer);
  }, [hideSplash]);

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
      <Stack.Screen name="stats" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="transactions/[id]" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="ai" />
      <Stack.Screen name="scheduled/index" />
      <Stack.Screen name="scheduled/[id]" />
      <Stack.Screen name="settings/profile" />
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

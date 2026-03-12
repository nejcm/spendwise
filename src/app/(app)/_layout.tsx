import { Redirect, SplashScreen, Stack } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import { useAppStore } from '@/lib/store';

export default function AppLayout() {
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="transactions" />
    </Stack>
  );
}

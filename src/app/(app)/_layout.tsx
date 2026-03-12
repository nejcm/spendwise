import { Redirect, SplashScreen, Tabs } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import { CustomTabBar } from '@/components/ui/custom-tab-bar';
import { useAppStore } from '@/lib/store';

export default function TabLayout() {
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
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarButtonTestID: 'home-tab',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarButtonTestID: 'categories-tab',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarButtonTestID: 'stats-tab',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
    </Tabs>
  );
}

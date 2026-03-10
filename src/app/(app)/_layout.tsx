import { Redirect, SplashScreen, Tabs } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';

import {
  PieChart as BudgetsIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Receipt as TransactionsIcon,
} from '@/components/ui/icons';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';

export default function TabLayout() {
  const [isFirstTime] = useIsFirstTime();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      hideSplash();
    }, 1000);
    return () => clearTimeout(timer);
  }, [hideSplash]);

  if (isFirstTime || true) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          tabBarButtonTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color }) => <TransactionsIcon color={color} />,
          tabBarButtonTestID: 'transactions-tab',
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color }) => <BudgetsIcon color={color} />,
          tabBarButtonTestID: 'budgets-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
    </Tabs>
  );
}

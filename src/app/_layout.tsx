import type { SQLiteDatabase } from 'expo-sqlite';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useThemeConfig } from '@/components/ui/use-theme-config';

import {
  checkBudgetAlerts,
  checkUpcomingBills,
  setupNotifications,
} from '@/features/notifications/notifications';
import { LockScreen } from '@/features/security/lock-screen';
import { processRecurringRules } from '@/features/subscriptions/api';
import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { migrateDbIfNeeded } from '@/lib/sqlite';
import { setLockEnabled, useAppStore } from '../lib/store';
// Import  global CSS file
import '../global.css';

async function initDb(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  await processRecurringRules(db);
  await setupNotifications();
  await checkBudgetAlerts(db);
  await checkUpcomingBills(db);
}

export { ErrorBoundary } from 'expo-router';

// eslint-disable-next-line react-refresh/only-export-components
export const unstable_settings = {
  initialRouteName: '(app)',
};

loadSelectedTheme();
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

function SecurityLock() {
  const isLocked = useAppStore.use.lockEnabled();
  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        backgroundTimeRef.current = Date.now();
      }
      else if (state === 'active') {
        if (!useAppStore.getState().lockEnabled) return;
        const ms = useAppStore.getState().lockTimeoutMinutes * 60 * 1000;
        const elapsed
          = backgroundTimeRef.current !== null ? Date.now() - backgroundTimeRef.current : Infinity;
        if (elapsed >= ms) {
          setLockEnabled(true);
        }
      }
    });
    return () => sub.remove();
  }, []);

  return <LockScreen visible={isLocked} onUnlock={() => setLockEnabled(false)} />;
}

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
      <SecurityLock />
    </Providers>
  );
}

function WebFontsLoader({
  children,
  fallback,
}: {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasFallback = !!fallback;
  const [forceFallback, setForceFallback] = useState(hasFallback);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setForceFallback(false);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const [loaded, error] = useFonts({
    'Roboto': require('node_modules/@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf'),
    'Roboto-Medium': require('node_modules/@expo-google-fonts/roboto/500Medium/Roboto_500Medium.ttf'),
    'Roboto-Bold': require('node_modules/@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf'),
    'Roboto-Black': require('node_modules/@expo-google-fonts/roboto/900Black/Roboto_900Black.ttf'),
  });

  return (loaded || error) && !forceFallback ? children : fallback;
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  const FontLoader = Platform.OS === 'web' ? WebFontsLoader : React.Fragment;

  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <SQLiteProvider databaseName="spendwise.db" onInit={initDb}>
            <APIProvider>
              <FontLoader>
                <BottomSheetModalProvider>
                  {children}
                  <FlashMessage position="top" />
                </BottomSheetModalProvider>
              </FontLoader>
            </APIProvider>
          </SQLiteProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

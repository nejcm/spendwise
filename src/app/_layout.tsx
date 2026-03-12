import type { SQLiteDatabase } from 'expo-sqlite';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { CustomTabBar } from '@/components/ui/custom-tab-bar';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import {
  checkBudgetAlerts,
  checkUpcomingBills,
  setupNotifications,
} from '@/features/notifications/notifications';
import { SecurityLock } from '@/features/security/security-lock';
import { loadSelectedTheme } from '@/features/theme/use-selected-theme';
import { APIProvider } from '@/lib/api';
import { DatabaseErrorBoundary, migrateDb, OpfsCleaner } from '@/lib/sqlite';
// Import  global CSS file
import '../global.css';

async function initDb(db: SQLiteDatabase) {
  await migrateDb(db);
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

function PersistentTabBar() {
  const pathname = usePathname();
  if (pathname === '/onboarding') return null;
  return <CustomTabBar />;
}

export default function RootLayout() {
  return (
    <Providers>
      <View style={styles.content}>
        <Stack>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack>
        <PersistentTabBar />
      </View>
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
  // fix for web fonts loading
  const FontLoader = Platform.OS === 'web' ? WebFontsLoader : React.Fragment;

  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <OpfsCleaner>
            <DatabaseErrorBoundary>
              <SQLiteProvider databaseName="spendwise.db" onInit={initDb}>
                <AppErrorBoundary>
                  <APIProvider>
                    <FontLoader>
                      <BottomSheetModalProvider>
                        {children}
                        <FlashMessage position="top" />
                      </BottomSheetModalProvider>
                    </FontLoader>
                  </APIProvider>
                </AppErrorBoundary>
              </SQLiteProvider>
            </DatabaseErrorBoundary>
          </OpfsCleaner>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

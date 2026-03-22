import type { SQLiteDatabase } from 'expo-sqlite';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { GlobalSheet } from '@/components/global-sheet';
import { CustomTabBar } from '@/components/ui/custom-tab-bar';
import { useCurrencyRates } from '@/features/currencies/api';
import { todayUnix } from '@/features/formatting/helpers';
import {
  checkUpcomingBills,
  setupNotifications,
} from '@/features/notifications/notifications';
import { ScheduledTransactionsProcessor } from '@/features/scheduled-transactions/scheduled-transactions-processor';
import { processDueScheduledTransactions } from '@/features/scheduled-transactions/scheduler';
import { SecurityLock } from '@/features/security/security-lock';
import { APIProvider } from '@/lib/api';

import { IS_WEB } from '@/lib/base';
import { DatabaseErrorBoundary, migrateDb, OpfsCleaner } from '@/lib/sqlite';
import { loadSelectedTheme, useSelectedTheme } from '@/lib/theme/use-selected-theme';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { SafeAreaView } from '../components/ui';
import { DB_NAME } from '../config';
// Import  global CSS file
import '../global.css';

async function initDb(db: SQLiteDatabase) {
  await migrateDb(db);
  await setupNotifications();
  await processDueScheduledTransactions(db, todayUnix());
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

function CurrencyRatesInitializer() {
  useCurrencyRates();
  return null;
}

function DevThemeToggle() {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();

  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web') return;

    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === '0') {
        e.preventDefault();
        setSelectedTheme(selectedTheme === 'dark' ? 'light' : 'dark');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedTheme, setSelectedTheme]);

  return null;
}

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
      <PersistentTabBar />
      <GlobalSheet />
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
    'Inter': require('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    'Inter-Medium': require('node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    'Inter-SemiBold': require('node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    'Inter-Bold': require('node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
    'Inter-Black': require('node_modules/@expo-google-fonts/inter/900Black/Inter_900Black.ttf'),
  });

  return (loaded || error) && !forceFallback ? children : fallback;
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  // fix for web fonts loading
  const FontLoader = IS_WEB ? WebFontsLoader : React.Fragment;

  return (
    <GestureHandlerRootView
      style={styles.container}
      // eslint-disable-next-line better-tailwindcss/no-unknown-classes
      className={theme.dark ? `dark` : undefined}
    >
      <SafeAreaProvider>
        <KeyboardProvider>
          <ThemeProvider value={theme}>
            <OpfsCleaner>
              <DatabaseErrorBoundary>
                <SQLiteProvider databaseName={DB_NAME} onInit={initDb}>
                  <AppErrorBoundary>
                    <APIProvider>
                      <ScheduledTransactionsProcessor />
                      <CurrencyRatesInitializer />
                      <FontLoader>
                        <BottomSheetModalProvider>
                          <SafeAreaView className="flex-1 bg-background">
                            {children}
                          </SafeAreaView>
                          <FlashMessage position="top" />
                          <DevThemeToggle />
                        </BottomSheetModalProvider>
                      </FontLoader>
                    </APIProvider>
                  </AppErrorBoundary>
                </SQLiteProvider>
              </DatabaseErrorBoundary>
            </OpfsCleaner>
          </ThemeProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

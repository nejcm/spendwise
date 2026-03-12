import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
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
import { db } from '@/lib/drizzle/db';
import { seedDefaults } from '@/lib/drizzle/seeds';
import { DatabaseErrorBoundary, OpfsCleaner } from '@/lib/sqlite';
import migrations from '../../drizzle/migrations';
// Import global CSS file
import '../global.css';

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
    'Inter': require('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    'Inter-Medium': require('node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    'Inter-SemiBold': require('node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    'Inter-Bold': require('node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
    'Inter-Black': require('node_modules/@expo-google-fonts/inter/900Black/Inter_900Black.ttf'),
  });

  return (loaded || error) && !forceFallback ? children : fallback;
}

function MigrationWrapper({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!success || initialized) return;

    async function init() {
      await seedDefaults().catch((err: unknown) => {
        // Only suppress unique-constraint errors (categories already seeded on re-open)
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('UNIQUE constraint failed')) throw err;
      });
      await setupNotifications();
      await checkBudgetAlerts();
      await checkUpcomingBills();
      setInitialized(true);
      SplashScreen.hideAsync();
    }

    init();
  }, [success, initialized]);

  if (error) return <DatabaseErrorBoundary>{null}</DatabaseErrorBoundary>;
  if (!success || !initialized) return null;

  return <>{children}</>;
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
              <MigrationWrapper>
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
              </MigrationWrapper>
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

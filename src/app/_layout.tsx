import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import * as React from 'react';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '@/components/app-error-boundary';
import { GlobalScanManager } from '@/components/global-scan-manager';
import { GlobalSheet } from '@/components/global-sheet';
import { SafeAreaView, View } from '@/components/ui';
import { CustomTabBar, TAB_BAR_COLOR, TAB_BAR_DARK_COLOR } from '@/components/ui/custom-tab-bar';
import { DB_NAME } from '@/config';
import { useCurrencyRates } from '@/features/currencies/api';
import { AutoBackupProcessor } from '@/features/imports-export/auto-backup-processor';
import { ScheduledTransactionsProcessor } from '@/features/scheduled-transactions/scheduled-transactions-processor';
import { SecurityLock } from '@/features/security/security-lock';

import { PosthogProviderWrapper } from '@/lib/analytics/posthog';
import { APIProvider } from '@/lib/api';
import { useAppBootstrapOnInit } from '@/lib/app-bootstrap';
import { IS_WEB } from '@/lib/base';
import { DatabaseErrorBoundary, OpfsCleaner } from '@/lib/sqlite';
import { loadSelectedTheme, useSelectedTheme } from '@/lib/theme/use-selected-theme';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
// Import  global CSS file
import '../global.css';

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
// Safety net: force-hide splash after 10s in case initialization hangs in production.
// hideAsync() is idempotent — bootstrap also calls hide when SQLite onInit succeeds.
setTimeout(() => {
  SplashScreen.hideAsync().catch(() => {});
}, 6_000);

function PersistentTabBar() {
  const pathname = usePathname();
  if (pathname === '/onboarding') return null;
  return <CustomTabBar />;
}

function CurrencyRatesInitializer() {
  useCurrencyRates();
  return null;
}

function BootstrappedSQLite({ children }: { children: React.ReactNode }) {
  const onInit = useAppBootstrapOnInit();
  return (
    <SQLiteProvider databaseName={DB_NAME} onInit={onInit}>
      {children}
    </SQLiteProvider>
  );
}

function DevThemeToggle() {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();

  useEffect(() => {
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

function WebFontsLoader({ children }: { children?: React.ReactNode }) {
  const [_loader, error] = useFonts({
    'Inter': require('node_modules/@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    'Inter-Medium': require('node_modules/@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    'Inter-SemiBold': require('node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    'Inter-Bold': require('node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  });

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  return children;
}

const flashListStyle = IS_WEB ? undefined : { paddingTop: 32 };

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
      <PosthogProviderWrapper>
        <SafeAreaProvider>
          <KeyboardProvider>
            <ThemeProvider value={theme}>
              <OpfsCleaner>
                <DatabaseErrorBoundary>
                  <APIProvider>
                    <BootstrappedSQLite>
                      <AppErrorBoundary>
                        <CurrencyRatesInitializer />
                        <ScheduledTransactionsProcessor />
                        <AutoBackupProcessor />
                        <FontLoader>
                          <BottomSheetModalProvider>
                            <View className="flex-1 bg-white">
                              <SafeAreaView className="flex-1 bg-background">
                                {children}
                              </SafeAreaView>
                            </View>
                            <FlashMessage position="top" style={flashListStyle} />
                            {__DEV__ && IS_WEB && <DevThemeToggle />}
                          </BottomSheetModalProvider>
                        </FontLoader>
                      </AppErrorBoundary>
                    </BootstrappedSQLite>
                  </APIProvider>
                </DatabaseErrorBoundary>
              </OpfsCleaner>
            </ThemeProvider>
          </KeyboardProvider>
        </SafeAreaProvider>
      </PosthogProviderWrapper>
    </GestureHandlerRootView>
  );
}

const hiddenHeader = { headerShown: false };
export default function RootLayout() {
  const { dark } = useThemeConfig();
  return (
    <Providers>
      <Stack screenOptions={{ navigationBarColor: dark ? TAB_BAR_DARK_COLOR : TAB_BAR_COLOR }}>
        <Stack.Screen name="(app)" options={hiddenHeader} />
        <Stack.Screen name="onboarding" options={hiddenHeader} />
      </Stack>
      <PersistentTabBar />
      <GlobalSheet />
      <GlobalScanManager />
      <SecurityLock />
    </Providers>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

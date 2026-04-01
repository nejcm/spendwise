/* eslint-disable react-refresh/only-export-components */
import type { RenderOptions } from '@testing-library/react-native';

import type { ReactElement } from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { render, userEvent } from '@testing-library/react-native';
import * as React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '@shopify/flash-list/jestSetup';

const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

function createAppWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <BottomSheetModalProvider>
        <NavigationContainer>{children}</NavigationContainer>
      </BottomSheetModalProvider>
    </SafeAreaProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const Wrapper = createAppWrapper(); // make sure we have a new wrapper for each render
  return render(ui, { wrapper: Wrapper, ...options });
}

// use this if you want to test user events
export function setup(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const Wrapper = createAppWrapper();
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export * from '@testing-library/react-native';
export { customRender as render };

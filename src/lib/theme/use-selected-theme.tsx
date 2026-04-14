import type { ThemeType } from '@/features/settings/theme';
import * as React from 'react';

import { Uniwind, useUniwind } from 'uniwind';
import { getAppState, setTheme, useAppStore } from '@/lib/store/store';

export type { ThemeType as ColorSchemeType };

/**
 * this hooks should only be used while selecting the theme
 * This hooks will return the selected theme which is stored in the app store
 * selectedTheme should be one of the following values 'light', 'dark' or 'system'
 * don't use this hooks if you want to use it to style your component based on the theme use useUniwind from uniwind instead
 */
export function useSelectedTheme() {
  const { theme: _theme } = useUniwind();
  const selectedTheme = useAppStore.use.theme();

  const setSelectedTheme = React.useCallback((t: ThemeType) => {
    Uniwind.setTheme(t);
    setTheme(t);
  }, []);

  return { selectedTheme, setSelectedTheme } as const;
}

// to be used in the root file to load the selected theme from the store
export function loadSelectedTheme() {
  const theme = getAppState().theme;
  if (theme !== undefined) {
    Uniwind.setTheme(theme);
  }
}

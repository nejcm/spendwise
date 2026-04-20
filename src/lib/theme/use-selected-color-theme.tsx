import type { ColorThemeType } from '@/lib/store/store';
import * as React from 'react';
import { Uniwind } from 'uniwind';
import { getAppState, setColorTheme, useAppStore } from '@/lib/store/store';
import { COLOR_THEME_VARIABLES } from './color-theme';

function applyColorThemeVariables(colorTheme: ColorThemeType) {
  const { light, dark } = COLOR_THEME_VARIABLES[colorTheme] || COLOR_THEME_VARIABLES.black;

  Uniwind.updateCSSVariables('light', {
    '--color-primary': light.accent,
    '--color-primary-foreground': light.accentForeground,
  });
  Uniwind.updateCSSVariables('dark', {
    '--color-primary': dark.accent,
    '--color-primary-foreground': dark.accentForeground,
  });
}

function setSelectedColorTheme(colorTheme: ColorThemeType) {
  applyColorThemeVariables(colorTheme);
  setColorTheme(colorTheme);
}

export function useSelectedColorTheme() {
  const selectedColorTheme = useAppStore.use.colorTheme();
  const normalizedColorTheme = selectedColorTheme ?? 'black';

  React.useEffect(() => {
    setSelectedColorTheme(normalizedColorTheme);
  }, [normalizedColorTheme]);

  return { selectedColorTheme: normalizedColorTheme, setSelectedColorTheme } as const;
}

export function loadSelectedColorTheme() {
  const colorTheme = getAppState().colorTheme;
  const normalizedColorTheme = colorTheme ?? 'black';

  if (colorTheme !== normalizedColorTheme) {
    setColorTheme(normalizedColorTheme);
  }

  applyColorThemeVariables(normalizedColorTheme);
}

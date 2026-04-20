import type { ColorThemeType } from '@/lib/store/store';
import * as React from 'react';
import { Uniwind } from 'uniwind';
import { getAppState, setColorTheme, useAppStore } from '@/lib/store/store';
import { COLOR_THEME_VARIABLES } from './color-theme';

function applyColorThemeVariables(colorTheme: ColorThemeType) {
  const { light, dark } = COLOR_THEME_VARIABLES[colorTheme] || COLOR_THEME_VARIABLES.black;

  const variablesByTheme = {
    light: {
      '--color-primary': light.accent,
      '--color-primary-foreground': light.accentForeground,
    },
    dark: {
      '--color-primary': dark.accent,
      '--color-primary-foreground': dark.accentForeground,
    },
  };

  Uniwind.updateCSSVariables('light', variablesByTheme.light);
  Uniwind.updateCSSVariables('dark', variablesByTheme.dark);
}

function setSelectedColorTheme(colorTheme: ColorThemeType) {
  applyColorThemeVariables(colorTheme);
  setColorTheme(colorTheme);
}

export function useSelectedColorTheme() {
  const selectedColorTheme = useAppStore.use.colorTheme();
  const color = selectedColorTheme ?? 'black';

  React.useEffect(() => {
    setSelectedColorTheme(color);
  }, [color]);

  return { selectedColorTheme: color, setSelectedColorTheme } as const;
}

export function loadSelectedColorTheme() {
  const colorTheme = getAppState().colorTheme;
  const color = colorTheme ?? 'black';

  if (colorTheme !== color) {
    setColorTheme(color);
  }

  applyColorThemeVariables(color);
}

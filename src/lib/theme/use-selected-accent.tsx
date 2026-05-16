import type { AccentType } from './accent';
import * as React from 'react';
import { Uniwind } from 'uniwind';
import { getAppState, setAccentColor, useAppStore } from '@/lib/store/store';
import { ACCENT_VARIABLES } from './accent';

function applyAccentColorVariables(colorTheme: AccentType) {
  const { light, dark } = ACCENT_VARIABLES[colorTheme] || ACCENT_VARIABLES.black;

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

function setSelected(accentColor: AccentType) {
  applyAccentColorVariables(accentColor);
  setAccentColor(accentColor);
}

export function useSelectedAccent() {
  const selectedAccent = useAppStore.use.colorTheme();
  const accent = selectedAccent ?? 'black';

  React.useEffect(() => {
    setSelected(accent);
  }, [accent]);

  return { selected: accent, setSelected } as const;
}

export function loadSelectedAccentColor() {
  const colorTheme = getAppState().colorTheme;
  const color = colorTheme ?? 'black';

  if (colorTheme !== color) setAccentColor(color);
  applyAccentColorVariables(color);
}

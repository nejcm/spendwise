import type { AccentType, AccentVariables } from './accent';
import * as React from 'react';
import { Uniwind } from 'uniwind';
import { getAppState, setAccentColor, useAppStore } from '@/lib/store/store';
import { ACCENT_VARIABLES } from './accent';

const DEFAULT_ACCENT: AccentType = 'spendwise';

// Legacy accents have no soft/line shades; #RRGGBBAA tints of the accent stand in.
function accentCSSVariables({ accent, accentForeground, accentSoft, accentLine }: AccentVariables['light']) {
  return {
    '--color-accent': accent,
    '--color-accent-foreground': accentForeground,
    '--color-accent-soft': accentSoft ?? `${accent}1f`,
    '--color-accent-line': accentLine ?? `${accent}4d`,
  };
}

function applyAccentColorVariables(colorTheme: AccentType) {
  const { light, dark } = ACCENT_VARIABLES[colorTheme] || ACCENT_VARIABLES[DEFAULT_ACCENT];

  Uniwind.updateCSSVariables('light', accentCSSVariables(light));
  Uniwind.updateCSSVariables('dark', accentCSSVariables(dark));
}

function setSelected(accentColor: AccentType) {
  applyAccentColorVariables(accentColor);
  setAccentColor(accentColor);
}

export function useSelectedAccent() {
  const selectedAccent = useAppStore.use.colorTheme();
  const accent = selectedAccent ?? DEFAULT_ACCENT;

  React.useEffect(() => {
    setSelected(accent);
  }, [accent]);

  return { selected: accent, setSelected } as const;
}

export function loadSelectedAccentColor() {
  const colorTheme = getAppState().colorTheme;
  const color = colorTheme ?? DEFAULT_ACCENT;

  if (colorTheme !== color) setAccentColor(color);
  applyAccentColorVariables(color);
}

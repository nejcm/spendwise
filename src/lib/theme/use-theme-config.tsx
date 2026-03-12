import type { Theme } from '@react-navigation/native';
import { DarkTheme as _DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useUniwind } from 'uniwind';

const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    primary: '#ff7b1a',
    background: '#fcfcfc',
    card: '#efefef',
    text: '#0a0a0a',
    border: '#e5e5e5',
    notification: '#f7f0e9',
  },
};

const DarkTheme: Theme = {
  ..._DarkTheme,
  colors: {
    primary: '#ff7b1a',
    background: '#232633',
    card: '#1b1e28',
    text: '#fafafa',
    border: '#1f222d',
    notification: '#63605d',
  },
};

export function useThemeConfig() {
  const { theme } = useUniwind();

  if (theme === 'dark') return DarkTheme;
  return LightTheme;
}

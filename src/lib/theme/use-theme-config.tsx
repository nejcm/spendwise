import { useUniwind } from 'uniwind';
import { DarkTheme, LightTheme } from './styles';

export function useThemeConfig() {
  const { theme } = useUniwind();

  if (theme === 'dark') return DarkTheme;
  return LightTheme;
}

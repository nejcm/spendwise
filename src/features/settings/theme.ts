import { translate } from '@/lib/i18n';

export type ThemeType = 'dark' | 'light' | 'system';

export const THEMES: ThemeType[] = ['dark', 'light', 'system'];

export const THEMES_OPTIONS: {
  label: string;
  value: ThemeType;
}[] = [
  { label: `${translate('settings.theme.dark')} 🌙`, value: 'dark' },
  { label: `${translate('settings.theme.light')} 🌞`, value: 'light' },
  { label: `${translate('settings.theme.system')} ⚙️`, value: 'system' },
];

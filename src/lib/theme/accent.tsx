import type { TxKeyPath } from '@/lib/i18n';
import { View } from '@/components/ui';
import { translate } from '@/lib/i18n';

export type AccentType
  = | 'black'
    | 'mist'
    | 'stone'
    | 'clay'
    | 'meadow'
    | 'ocean'
    | 'wave'
    | 'grass'
    | 'pink'
    | 'reflection'
    | 'crimson'
    | 'gold'
    | 'lime'
    | 'coffee'
    | 'saltwater'
    | 'purple'
    | 'coral'
    | 'slate'
    | 'berry'
    | 'amber';

export type AccentVariables = {
  bg: string;
  light: {
    accent: string;
    accentForeground: string;
  };
  dark: {
    accent: string;
    accentForeground: string;
  };
};

export const ACCENTS: AccentType[] = [
  'black',
  'mist',
  'stone',
  'clay',
  'meadow',
  'ocean',
  'wave',
  'grass',
  'pink',
  'reflection',
  'crimson',
  'gold',
  'lime',
  'coffee',
  'saltwater',
  'purple',
  'coral',
  'slate',
  'berry',
  'amber',
];

const prefix = 'settings.accent';
export const ACCENT_LABEL_KEYS: Record<AccentType, TxKeyPath> = {
  black: `${prefix}.black`,
  mist: `${prefix}.mist`,
  stone: `${prefix}.stone`,
  clay: `${prefix}.clay`,
  meadow: `${prefix}.meadow`,
  ocean: `${prefix}.ocean`,
  wave: `${prefix}.wave`,
  grass: `${prefix}.grass`,
  pink: `${prefix}.pink`,
  reflection: `${prefix}.reflection`,
  crimson: `${prefix}.crimson`,
  gold: `${prefix}.gold`,
  lime: `${prefix}.lime`,
  coffee: `${prefix}.coffee`,
  saltwater: `${prefix}.saltwater`,
  purple: `${prefix}.purple`,
  coral: `${prefix}.coral`,
  slate: `${prefix}.slate`,
  berry: `${prefix}.berry`,
  amber: `${prefix}.amber`,
};

export const ACCENT_VARIABLES: Record<AccentType, AccentVariables> = {
  black: {
    bg: 'bg-[#111827] dark:bg-[#e5e7eb]',
    light: { accent: '#111827', accentForeground: '#f9fafb' },
    dark: { accent: '#e5e7eb', accentForeground: '#111827' },
  },
  mist: {
    bg: 'bg-[#90AFC5] dark:bg-[#90AFC5]',
    light: { accent: '#90AFC5', accentForeground: '#0f172a' },
    dark: { accent: '#90AFC5', accentForeground: '#0f172a' },
  },
  stone: {
    bg: 'bg-[#336B87] dark:bg-[#336B87]',
    light: { accent: '#336B87', accentForeground: '#f8fafc' },
    dark: { accent: '#336B87', accentForeground: '#f8fafc' },
  },
  clay: {
    bg: 'bg-[#A43820] dark:bg-[#A43820]',
    light: { accent: '#A43820', accentForeground: '#fff7ed' },
    dark: { accent: '#A43820', accentForeground: '#fff7ed' },
  },
  meadow: {
    bg: 'bg-[#598234] dark:bg-[#598234]',
    light: { accent: '#598234', accentForeground: '#f7fee7' },
    dark: { accent: '#598234', accentForeground: '#f7fee7' },
  },
  ocean: {
    bg: 'bg-[#07575B] dark:bg-[#07575B]',
    light: { accent: '#07575B', accentForeground: '#ecfeff' },
    dark: { accent: '#07575B', accentForeground: '#ecfeff' },
  },
  wave: {
    bg: 'bg-[#66A5AD] dark:bg-[#66A5AD]',
    light: { accent: '#66A5AD', accentForeground: '#06272b' },
    dark: { accent: '#66A5AD', accentForeground: '#06272b' },
  },
  grass: {
    bg: 'bg-[#486B00] dark:bg-[#486B00]',
    light: { accent: '#486B00', accentForeground: '#f7fee7' },
    dark: { accent: '#486B00', accentForeground: '#f7fee7' },
  },
  pink: {
    bg: 'bg-[#F18D9E] dark:bg-[#F18D9E]',
    light: { accent: '#F18D9E', accentForeground: '#4a1020' },
    dark: { accent: '#F18D9E', accentForeground: '#4a1020' },
  },
  reflection: {
    bg: 'bg-[#34675C] dark:bg-[#34675C]',
    light: { accent: '#34675C', accentForeground: '#f0fdf4' },
    dark: { accent: '#34675C', accentForeground: '#f0fdf4' },
  },
  crimson: {
    bg: 'bg-[#8D230F] dark:bg-[#8D230F]',
    light: { accent: '#8D230F', accentForeground: '#fff5f5' },
    dark: { accent: '#8D230F', accentForeground: '#fff5f5' },
  },
  gold: {
    bg: 'bg-[#C99E10] dark:bg-[#C99E10]',
    light: { accent: '#C99E10', accentForeground: '#3b2f05' },
    dark: { accent: '#C99E10', accentForeground: '#3b2f05' },
  },
  lime: {
    bg: 'bg-[#E4EA8C] dark:bg-[#E4EA8C]',
    light: { accent: '#E4EA8C', accentForeground: '#35410a' },
    dark: { accent: '#E4EA8C', accentForeground: '#35410a' },
  },
  coffee: {
    bg: 'bg-[#B38867] dark:bg-[#B38867]',
    light: { accent: '#B38867', accentForeground: '#2b2118' },
    dark: { accent: '#B38867', accentForeground: '#2b2118' },
  },
  saltwater: {
    bg: 'bg-[#257985] dark:bg-[#257985]',
    light: { accent: '#257985', accentForeground: '#f0fdfa' },
    dark: { accent: '#257985', accentForeground: '#f0fdfa' },
  },
  purple: {
    bg: 'bg-[#471396] dark:bg-[#471396]',
    light: { accent: '#471396', accentForeground: '#f5f3ff' },
    dark: { accent: '#471396', accentForeground: '#f5f3ff' },
  },
  coral: {
    bg: 'bg-[#E07A5F] dark:bg-[#E07A5F]',
    light: { accent: '#E07A5F', accentForeground: '#3d1410' },
    dark: { accent: '#E07A5F', accentForeground: '#3d1410' },
  },
  slate: {
    bg: 'bg-[#64748B] dark:bg-[#64748B]',
    light: { accent: '#64748B', accentForeground: '#f8fafc' },
    dark: { accent: '#64748B', accentForeground: '#f8fafc' },
  },
  berry: {
    bg: 'bg-[#8B3A62] dark:bg-[#8B3A62]',
    light: { accent: '#8B3A62', accentForeground: '#fdf2f8' },
    dark: { accent: '#8B3A62', accentForeground: '#fdf2f8' },
  },
  amber: {
    bg: 'bg-[#D97706] dark:bg-[#D97706]',
    light: { accent: '#D97706', accentForeground: '#451a03' },
    dark: { accent: '#D97706', accentForeground: '#451a03' },
  },
};

export const ACCENT_OPTIONS = ACCENTS.map((value) => ({
  value,
  label: translate(ACCENT_LABEL_KEYS[value]),
  prefix: <View className={`mr-4 size-8 rounded-full ${ACCENT_VARIABLES[value].bg}`} />,
}));

// https://colorhunt.co/palettes/popular

import type { OptionType } from '@/components/ui';

export const chartColors = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#f59e0b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#2dd4bf',
  lime: '#84cc16',
  cyan: '#06b6d4',
  brown: '#854d0e',
};

export const COLORS = [
  // gray
  '#f6f6f7',
  '#ebebec',
  '#dadbdc',
  '#c3c4c4',
  '#a8a9aa',
  '#8c8e90',
  '#717375',
  '#434548',
  '#2a2c30',
  '#1a1c20',
  // red
  '#fef2f2',
  '#fee2e2',
  '#fecaca',
  '#fca5a5',
  '#f87171',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
  // orange
  '#fff7ed',
  '#ffedd5',
  '#fed7aa',
  '#fdba74',
  '#fb923c',
  '#f97316',
  '#ea580c',
  '#c2410c',
  '#9a3412',
  '#7c2d12',
  // yellow
  '#fefce8',
  '#fef9c3',
  '#fef08a',
  '#fde047',
  '#facc15',
  '#eab308',
  '#ca8a04',
  '#a16207',
  '#854d0e',
  '#713f12',
  // lime
  '#f7fee7',
  '#ecfccb',
  '#d9f99d',
  '#bef264',
  '#a3e635',
  '#84cc16',
  '#65a30d',
  '#4d7c0f',
  '#3f6212',
  '#365314',
  // green
  '#f0fdf4',
  '#dcfce7',
  '#bbf7d0',
  '#86efac',
  '#4ade80',
  '#22c55e',
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d',
  // teal
  '#f0fdfa',
  '#ccfbf1',
  '#99f6e4',
  '#5eead4',
  '#2dd4bf',
  '#14b8a6',
  '#0d9488',
  '#0f766e',
  '#115e59',
  '#134e4a',
  // cyan
  '#ecfeff',
  '#cffafe',
  '#a5f3fc',
  '#67e8f9',
  '#22d3ee',
  '#06b6d4',
  '#0891b2',
  '#0e7490',
  '#155e75',
  '#164e63',
  // sky
  '#f0f9ff',
  '#e0f2fe',
  '#bae6fd',
  '#7dd3fc',
  '#38bdf8',
  '#0ea5e9',
  '#0284c7',
  '#0369a1',
  '#075985',
  '#0c4a6e',
  // blue
  '#eff6ff',
  '#dbeafe',
  '#bfdbfe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#1e40af',
  '#1e3a8a',
  // purple
  '#faf5ff',
  '#f3e8ff',
  '#e9d5ff',
  '#d8b4fe',
  '#c084fc',
  '#a855f7',
  '#9333ea',
  '#7e22ce',
  '#6b21a8',
  '#581c87',
  // pink
  '#fdf2f8',
  '#fce7f3',
  '#fbcfe8',
  '#f9a8d4',
  '#f472b6',
  '#ec4899',
  '#db2777',
  '#be185d',
  '#9d174d',
  '#831843',
];
export const COLOR_OPTIONS = COLORS.map((color) => ({ label: color, value: color } satisfies OptionType));

export function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function isHexColor(value: Maybe<string>) {
  return !!value?.startsWith('#');
}

/**
 * Converts a hex color to a hex color with a given opacity.
 * @param hex - The hex color to convert (#4a6df3).
 * @param opacity - The opacity to apply to the hex color (0-99).
 * @returns The hex color with the given opacity.
 */
export function hexWithOpacity(hex: Maybe<string>, opacity: number) {
  if (!hex || !isHexColor(hex)) return undefined;
  return `${hex}${opacity}`;
}

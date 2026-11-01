import type { ThemeType } from '../theme';
import * as React from 'react';
import { View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useSelectedTheme } from '@/lib/theme/use-selected-theme';
import { ChoiceTile } from './choice-tile';

const THEME_PREVIEWS: { value: ThemeType; swatch: string; card: string; bar: string }[] = [
  { value: 'light', swatch: '#efeafc', card: '#ffffff', bar: '#6b4fd8' },
  { value: 'dark', swatch: '#111214', card: '#2a2b30', bar: '#d4f05a' },
  { value: 'system', swatch: '#efeafc', card: '#c9c4d6', bar: '#8f7fd0' },
];

function ThemePreview({ swatch, card, bar, split }: { swatch: string; card: string; bar: string; split: boolean }) {
  return (
    <View className="h-[72px] overflow-hidden rounded-[10px]" style={{ backgroundColor: swatch }}>
      {split && <View className="absolute inset-y-0 right-0 w-1/2 bg-[#111214]" />}
      <View className="absolute inset-x-2 top-2.5 h-4 rounded-[5px]" style={{ backgroundColor: card }} />
      <View className="absolute top-[34px] left-2 h-2 w-[34px] rounded-sm" style={{ backgroundColor: bar }} />
      <View className="absolute top-12 left-2 h-2 w-[52px] rounded-sm" style={{ backgroundColor: card }} />
    </View>
  );
}

export function ThemePicker() {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={translate('settings.theme.title')} className="flex-row gap-2.5">
      {THEME_PREVIEWS.map(({ value, ...preview }) => (
        <ChoiceTile key={value} label={translate(`settings.theme.${value}`)} selected={value === selectedTheme} onPress={() => setSelectedTheme(value)}>
          <ThemePreview {...preview} split={value === 'system'} />
        </ChoiceTile>
      ))}
    </View>
  );
}

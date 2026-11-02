import type { DensityType } from '@/lib/store/store';
import * as React from 'react';
import { Card, Pressable, SectionHeader, Text, View } from '@/components/ui';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { updateAppState, useAppStore } from '@/lib/store/store';
import { ACCENT_LABEL_KEYS, ACCENT_VARIABLES, ACCENTS } from '@/lib/theme/accent';
import { useSelectedAccent } from '@/lib/theme/use-selected-accent';
import { ChoiceTile } from './components/choice-tile';
import { SettingsPage } from './components/settings-page';
import { ThemePicker } from './components/theme-picker';

const DENSITY_PREVIEWS: { value: DensityType; rows: number; gap: string; row: string }[] = [
  { value: 'default', rows: 3, gap: 'gap-2', row: 'h-3 rounded' },
  { value: 'compact', rows: 5, gap: 'gap-1', row: 'h-2 rounded-[3px]' },
];

export function AppearanceSettingsScreen() {
  const density = useAppStore.use.density();
  const { selected: accent, setSelected: setAccent } = useSelectedAccent();

  return (
    <SettingsPage title={translate('settings.appearance')}>
      <SectionHeader title={translate('settings.theme.title')} />
      <ThemePicker />

      <View className="flex-row items-baseline justify-between gap-3 px-1 pt-5 pb-2">
        <Text accessibilityRole="header" className="text-meta font-medium text-muted-foreground">{translate('settings.accent.title')}</Text>
        {accent === 'spendwise' && <Text className="min-w-0 shrink text-meta text-muted-foreground" numberOfLines={1}>{translate('settings.accent.spendwise_hint')}</Text>}
      </View>
      <Card accessibilityRole="radiogroup" accessibilityLabel={translate('settings.accent.title')} className="flex-row flex-wrap px-3 py-4">
        {ACCENTS.map((value) => {
          const selected = value === accent;
          const label = translate(ACCENT_LABEL_KEYS[value]);
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: selected }}
              onPress={() => setAccent(value)}
              className="w-1/5 items-center gap-1.5 py-1.5"
            >
              <View className={cn('size-12 items-center justify-center rounded-full border-2', selected ? 'border-foreground' : 'border-transparent')}>
                <View className={cn('size-10 rounded-full', ACCENT_VARIABLES[value].bg)} />
              </View>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </Card>

      <SectionHeader title={translate('settings.density')} />
      <View accessibilityRole="radiogroup" accessibilityLabel={translate('settings.density')} className="flex-row gap-2.5">
        {DENSITY_PREVIEWS.map(({ value, rows, gap, row }) => (
          <ChoiceTile
            key={value}
            label={translate(`settings.density_options.${value}`)}
            selected={value === density}
            onPress={() => updateAppState({ density: value })}
            className="p-3"
          >
            <View className={cn('h-[76px] justify-center', gap)}>
              {Array.from({ length: rows }, (_, i) => <View key={i} className={cn('bg-card-2', row)} />)}
            </View>
          </ChoiceTile>
        ))}
      </View>
    </SettingsPage>
  );
}

import type { HomeScreenChartType, LongPressActionType } from '@/lib/store/store';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { Card, SectionHeader, SegmentedControl, View } from '@/components/ui';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { updateAppState, useAppStore } from '@/lib/store/store';
import { ChoiceTile } from './components/choice-tile';
import { SettingsPage } from './components/settings-page';
import { ToggleRow } from './components/toggle-row';

const CHART_PREVIEWS: { value: HomeScreenChartType; path: string }[] = [
  { value: 'balance', path: 'M6 26 L20 28 L34 29 L48 30 L60 31 L66 12 L84 13' },
  { value: 'category_spending', path: 'M8 20 H40 M44 20 H62 M66 20 H76 M80 20 H84' },
  { value: 'none', path: 'M8 20 H82' },
];

const LONG_PRESS_ACTIONS: LongPressActionType[] = ['scan_receipt', 'pick_from_gallery'];

export function GeneralSettingsScreen() {
  const saveOnScan = useAppStore.use.saveOnScan();
  const openTxOnCreate = useAppStore.use.openTxOnCreate();
  const longPressAction = useAppStore.use.longPressAction();
  const recommendationsEnabled = useAppStore.use.recommendationsEnabled();
  const homeScreenChart = useAppStore.use.homeScreenChart();
  const accent = String(useCSSVariable('--color-accent') ?? '#6b4fd8');
  const track = String(useCSSVariable('--color-track') ?? '#ebe8f3');

  const toggles = [
    { key: 'openTxOnCreate', title: translate('settings.open_transaction_after_create'), description: translate('settings.open_transaction_after_create_description'), checked: openTxOnCreate, onChange: (on: boolean) => updateAppState({ openTxOnCreate: on }) },
    { key: 'saveOnScan', title: translate('settings.save_on_scan'), description: translate('settings.save_on_scan_description'), checked: !!saveOnScan, onChange: (on: boolean) => updateAppState({ saveOnScan: on }) },
    { key: 'recommendations', title: translate('settings.recommendations_enabled'), description: translate('settings.recommendations_enabled_description'), checked: recommendationsEnabled, onChange: (on: boolean) => updateAppState({ recommendationsEnabled: on }) },
  ];

  return (
    <SettingsPage title={translate('settings.general')}>
      <SectionHeader title={translate('settings.home_screen_chart')} />
      <View accessibilityRole="radiogroup" accessibilityLabel={translate('settings.home_screen_chart')} className="flex-row gap-2">
        {CHART_PREVIEWS.map(({ value, path }) => (
          <ChoiceTile
            key={value}
            label={translate(`settings.home_screen_chart_options.${value}`)}
            selected={value === homeScreenChart}
            onPress={() => updateAppState({ homeScreenChart: value })}
            className="gap-2"
          >
            <View className="overflow-hidden rounded-lg bg-card-2">
              <Svg width="100%" height={40} viewBox="0 0 90 40" preserveAspectRatio="none">
                <Path d={path} fill="none" stroke={value === 'none' ? track : accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              </Svg>
            </View>
          </ChoiceTile>
        ))}
      </View>

      <SectionHeader title={translate('settings.adding_transactions')} />
      <Card className="px-4">
        {toggles.map(({ key, ...toggle }, index) => (
          <ToggleRow key={key} className={cn(index > 0 && 'border-t border-border')} {...toggle} />
        ))}
      </Card>

      <SectionHeader title={translate('settings.long_press_action')} />
      <SegmentedControl
        accessibilityLabel={translate('settings.long_press_action')}
        options={LONG_PRESS_ACTIONS.map((value) => ({ value, label: translate(`settings.long_press_action_options.${value}`) }))}
        value={longPressAction}
        onChange={(value) => updateAppState({ longPressAction: value })}
      />
    </SettingsPage>
  );
}

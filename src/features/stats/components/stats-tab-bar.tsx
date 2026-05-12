import * as React from 'react';
import { SolidButton, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

export type StatsTab = 'overview' | 'calendar' | 'budget';

type Props = {
  value: StatsTab;
  onChange: (value: StatsTab) => void;
};

const TABS: { key: StatsTab; labelKey: 'stats.overview' | 'stats.calendar' | 'stats.budget' }[] = [
  { key: 'overview', labelKey: 'stats.overview' },
  { key: 'calendar', labelKey: 'stats.calendar' },
  { key: 'budget', labelKey: 'stats.budget' },
];

export function StatsTabBar({ value, onChange }: Props) {
  return (
    <View className="flex-row items-center justify-center gap-2 pt-2 pb-1">
      {TABS.map((tab) => {
        const isActive = value === tab.key;
        return (
          <SolidButton
            key={tab.key}
            className="min-w-24 items-center rounded-2xl"
            color={isActive ? 'secondary' : 'default-alt'}
            textClassName={`${isActive ? 'text-foreground' : 'text-muted-foreground'} text-sm/snug`}
            size="xs"
            label={translate(tab.labelKey)}
            onPress={() => onChange(tab.key)}
          />
        );
      })}
    </View>
  );
}

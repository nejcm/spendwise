import * as React from 'react';
import { SolidButton, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

export type StatsTab = 'overview' | 'budget';

type Props = {
  value: StatsTab;
  onChange: (value: StatsTab) => void;
};

export function StatsTabBar({ value, onChange }: Props) {
  return (
    <View className="flex-row items-center justify-center gap-2 pt-2 pb-1">
      <SolidButton
        className="min-w-24 items-center rounded-2xl"
        color={value === 'overview' ? 'secondary' : 'default-alt'}
        textClassName={`${value === 'overview' ? 'text-foreground' : 'text-muted-foreground'} text-sm/snug`}
        size="xs"
        label={translate('stats.overview')}
        onPress={() => onChange('overview')}
      />
      <SolidButton
        className="min-w-24 items-center rounded-2xl"
        color={value === 'budget' ? 'secondary' : 'default-alt'}
        textClassName={`${value === 'budget' ? 'text-foreground' : 'text-muted-foreground'} text-sm/snug`}
        size="xs"
        label={translate('stats.budget')}
        onPress={() => onChange('budget')}
      />
    </View>
  );
}

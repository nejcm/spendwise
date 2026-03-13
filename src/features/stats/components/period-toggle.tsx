import * as React from 'react';

import { Pressable, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Period = 'month' | 'year';

type Props = {
  value: Period;
  onChange: (value: Period) => void;
};

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row items-center justify-center gap-2 pb-4">
      <Pressable
        onPress={() => onChange('month')}
        className={`min-w-18 items-center rounded-2xl px-4 py-1 ${value === 'month' ? 'bg-muted' : ''}`}
      >
        <Text className={`text-sm ${value === 'month' ? 'text-foreground' : 'text-muted-foreground'}`}>
          {translate('common.month')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('year')}
        className={`min-w-18 items-center rounded-2xl px-4 py-1 ${value === 'year' ? 'bg-muted' : ''}`}
      >
        <Text className={`text-sm ${value === 'year' ? 'text-foreground' : 'text-muted-foreground'}`}>
          {translate('common.year')}
        </Text>
      </Pressable>
    </View>
  );
}

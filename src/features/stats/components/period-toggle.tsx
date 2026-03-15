import type { Period } from '../types';

import * as React from 'react';
import { SolidButton, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

type Props = {
  value: Period;
  onChange: (value: Period) => void;
};

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <View className="flex-row items-center justify-center gap-2 pb-4">
      <SolidButton
        className="min-w-18 items-center rounded-2xl"
        color={value === 'week' ? 'secondary' : 'primary-alt'}
        textClassName={value === 'week' ? '' : 'text-muted-foreground'}
        size="sm"
        label={translate('common.week')}
        onPress={() => onChange('week')}
      />
      <SolidButton
        onPress={() => onChange('month')}
        className="min-w-18 items-center rounded-2xl"
        color={value === 'month' ? 'secondary' : 'primary-alt'}
        textClassName={value === 'month' ? 'text-foreground' : 'text-muted-foreground'}
        size="sm"
        label={translate('common.month')}
      />
      <SolidButton
        onPress={() => onChange('year')}
        className="min-w-18 items-center rounded-2xl"
        color={value === 'year' ? 'secondary' : 'primary-alt'}
        textClassName={value === 'year' ? 'text-foreground' : 'text-muted-foreground'}
        size="sm"
        label={translate('common.year')}
      />
    </View>
  );
}

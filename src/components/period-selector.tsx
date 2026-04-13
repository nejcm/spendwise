import type { PeriodSelection } from '@/lib/store';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { Text, useModalSheet } from '@/components/ui';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { isNavigablePeriodMode, navigatePeriod } from '@/lib/date/helpers';
import { getPeriodLabel } from '@/lib/date/labels';
import { setPeriodSelection } from '@/lib/store';
import { PeriodSelectorModal } from './period-selector-modal';

export type PeriodSelectorProps = {
  selection: PeriodSelection;
  className?: string;
};

export function PeriodSelector({ selection, className }: PeriodSelectorProps) {
  const { ref, present } = useModalSheet();
  const isFixed = !isNavigablePeriodMode(selection.mode);
  const iconColor = `text-muted-foreground ${isFixed ? 'opacity-50' : ''}`;

  return (
    <>
      <View className={cn('flex-row items-center justify-between px-4 py-3', className)}>
        <IconButton size="sm" color="none" disabled={isFixed} onPress={() => setPeriodSelection(navigatePeriod(selection, -1))} hitSlop={12}>
          <ArrowLeftIcon className={iconColor} size={20} />
        </IconButton>
        <Pressable onPress={present} hitSlop={12}>
          <Text className="text-lg font-medium">{getPeriodLabel(selection)}</Text>
        </Pressable>
        <IconButton size="sm" color="none" disabled={isFixed} onPress={() => setPeriodSelection(navigatePeriod(selection, 1))} hitSlop={12}>
          <ArrowRightIcon className={iconColor} size={20} />
        </IconButton>
      </View>
      <PeriodSelectorModal ref={ref} selection={selection} />
    </>
  );
}

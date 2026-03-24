import type { PeriodSelection } from '@/lib/store';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { Text, useModal } from '@/components/ui';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { navigatePeriod } from '@/lib/date/helpers';
import { getPeriodLabel } from '@/lib/date/labels';
import { setPeriodSelection } from '@/lib/store';
import { PeriodSelectorModal } from './period-selector-modal';

export type PeriodSelectorProps = {
  selection: PeriodSelection;
  className?: string;
};

export function PeriodSelector({ selection, className }: PeriodSelectorProps) {
  const { ref, present } = useModal();
  const isAll = selection.mode === 'all';

  return (
    <>
      <View className={cn('flex-row items-center justify-between px-4 py-3', className)}>
        {!isAll && (
          <IconButton size="sm" color="none" onPress={() => setPeriodSelection(navigatePeriod(selection, -1))} hitSlop={12}>
            <ArrowLeftIcon className="text-muted-foreground" size={20} />
          </IconButton>
        )}
        <Pressable onPress={present} hitSlop={12}>
          <Text className="text-lg font-medium">{getPeriodLabel(selection)}</Text>
        </Pressable>
        {!isAll && (
          <IconButton size="sm" color="none" onPress={() => setPeriodSelection(navigatePeriod(selection, 1))} hitSlop={12}>
            <ArrowRightIcon className="text-muted-foreground" size={20} />
          </IconButton>
        )}
      </View>
      <PeriodSelectorModal ref={ref} selection={selection} />
    </>
  );
}

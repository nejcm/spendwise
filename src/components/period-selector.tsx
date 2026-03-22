import type { PeriodSelection } from '@/lib/store';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';
import { Text, useModal } from '@/components/ui';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { getPeriodLabel, navigatePeriod } from '@/lib/date/helpers';
import { PeriodSelectorModal } from './period-selector-modal';

export type PeriodSelectorProps = {
  selection: PeriodSelection;
  onSelect: (s: PeriodSelection) => void;
  className?: string;
};

export function PeriodSelector({ selection, onSelect, className }: PeriodSelectorProps) {
  const { ref, present } = useModal();

  const handleNavigate = (dir: -1 | 1) => {
    onSelect(navigatePeriod(selection, dir));
  };

  return (
    <>
      <View className={cn('flex-row items-center justify-between px-4 py-3', className)}>
        <IconButton size="sm" color="none" onPress={() => handleNavigate(-1)} hitSlop={12}>
          <ArrowLeftIcon className="text-muted-foreground" size={20} />
        </IconButton>
        <Pressable onPress={present} hitSlop={12}>
          <Text className="text-lg font-medium">{getPeriodLabel(selection)}</Text>
        </Pressable>
        <IconButton size="sm" color="none" onPress={() => handleNavigate(1)} hitSlop={12}>
          <ArrowRightIcon className="text-muted-foreground" size={20} />
        </IconButton>
      </View>
      <PeriodSelectorModal ref={ref} selection={selection} onSelect={onSelect} />
    </>
  );
}

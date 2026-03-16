import type { PeriodSelection } from '@/lib/store';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useModal } from '@/components/ui';
import { IconButton } from '@/components/ui/icon-button';
import { getPeriodLabel, navigatePeriod } from '@/lib/date/helpers';
import { PeriodSelectorModal } from './period-selector-modal';

export type PeriodSelectorProps = {
  selection: PeriodSelection;
  onSelect: (s: PeriodSelection) => void;
};

export function PeriodSelector({ selection, onSelect }: PeriodSelectorProps) {
  const { ref, present } = useModal();

  const handleNavigate = (dir: -1 | 1) => {
    onSelect(navigatePeriod(selection, dir));
  };

  return (
    <>
      <View className="flex-row items-center justify-between p-4">
        <IconButton size="sm" color="none" onPress={() => handleNavigate(-1)} hitSlop={12}>
          <ArrowLeftIcon className="size-5 text-muted-foreground" />
        </IconButton>
        <Pressable onPress={present} hitSlop={12}>
          <Text className="text-lg font-medium">{getPeriodLabel(selection)}</Text>
        </Pressable>
        <IconButton size="sm" color="none" onPress={() => handleNavigate(1)} hitSlop={12}>
          <ArrowRightIcon className="size-5 text-muted-foreground" />
        </IconButton>
      </View>
      <PeriodSelectorModal ref={ref} selection={selection} onSelect={onSelect} />
    </>
  );
}

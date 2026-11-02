import type { PeriodSelection } from '@/lib/store/store';
import * as React from 'react';
import { Pressable } from 'react-native';
import { PeriodSelectorModal } from '@/components/period-selector-modal';
import { getPressedStyle, Text, useModalSheet } from '@/components/ui';
import { ChevronDown } from '@/components/ui/icon';
import { getPeriodLabel } from '@/lib/date/labels';

export function PeriodPill({ selection }: { selection: PeriodSelection }) {
  const { ref, present } = useModalSheet();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={present}
        style={getPressedStyle}
        className="h-10 shrink flex-row items-center gap-1.5 rounded-full bg-card px-3.5"
      >
        <Text className="shrink text-sm font-medium" numberOfLines={1}>{getPeriodLabel(selection)}</Text>
        <ChevronDown size={16} colorClassName="accent-muted-foreground" />
      </Pressable>
      <PeriodSelectorModal ref={ref} selection={selection} />
    </>
  );
}

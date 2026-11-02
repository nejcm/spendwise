import type { ModalSheetRef } from '@/components/ui';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { IconTile, ModalSheet, SolidButton, Text } from '@/components/ui';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { COLORS } from '@/lib/theme/colors';
import { defaultStyles } from '@/lib/theme/styles';
import { colorLabel } from '../helpers';

const SWATCHES_PER_ROW = 10;
const ROWS = Array.from({ length: COLORS.length / SWATCHES_PER_ROW }, (_, i) => COLORS.slice(i * SWATCHES_PER_ROW, (i + 1) * SWATCHES_PER_ROW));

type ColorSheetProps = {
  ref: ModalSheetRef<unknown>;
  value: string;
  name: string;
  icon: string;
  onSelect: (color: string) => void;
};

export function ColorSheet({ ref, value, name, icon, onSelect }: ColorSheetProps) {
  const [picked, setPicked] = React.useState(value);

  return (
    <ModalSheet ref={ref} title={translate('categories.colour')} snapPoints={['85%']} onDismiss={() => setPicked(value)}>
      <BottomSheetScrollView style={defaultStyles.transparentBg} contentContainerClassName="px-5 pt-2 pb-6">
        <View className="flex-row items-center gap-3 rounded-card bg-card-2 p-3">
          <IconTile size="lg" color={picked} icon={icon} />
          <View className="min-w-0 flex-1 gap-1.5">
            <Text className="text-row font-medium" numberOfLines={1}>{name || translate('categories.new')}</Text>
            <Text className="text-meta text-muted-foreground">{colorLabel(picked)}</Text>
          </View>
          <View className="h-1.5 w-16 overflow-hidden rounded-full bg-track">
            <View className="h-full w-2/3 rounded-full" style={{ backgroundColor: picked }} />
          </View>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel={translate('categories.colour')} className="mt-4 gap-1">
          {ROWS.map((row) => (
            <View key={row[0]} className="flex-row justify-between">
              {row.map((color) => {
                const selected = color === picked.toLowerCase();
                return (
                  <Pressable
                    key={color}
                    accessibilityRole="radio"
                    accessibilityLabel={colorLabel(color)}
                    accessibilityState={{ checked: selected }}
                    onPress={() => setPicked(color)}
                    className={cn('size-8 items-center justify-center rounded-full border-2', selected ? 'border-foreground' : 'border-transparent')}
                  >
                    <View className={cn('rounded-full', selected ? 'size-5.5' : 'size-7')} style={{ backgroundColor: color }} />
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        <SolidButton className="mt-6" color="primary" size="lg" fullWidth label={translate('categories.use_colour')} onPress={() => onSelect(picked)} />
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

import * as React from 'react';
import { Pressable } from 'react-native';
import { cn } from 'tailwind-variants';

import { getPressedStyle, Text, View } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

export type AddCategoryCardProps = {
  onPress: () => void;
};

export function AddCategoryCard({ onPress }: AddCategoryCardProps) {
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';

  return (
    <View
      className={cn(
        'flex-1 justify-center rounded-xl border-2 border-dashed border-border',
        isCompact ? 'min-h-[60]' : 'min-h-[66]',
      )}
    >
      <Pressable
        onPress={onPress}
        style={getPressedStyle}
        className={cn('flex-1 flex-row items-center gap-2', isCompact ? 'px-1.5 py-0.5' : 'px-2 py-1')}
      >
        <View
          className={cn(
            'size-9 items-center justify-center rounded-lg bg-muted/40 3xs:size-10',
            isCompact ? '' : '2xs:size-12',
          )}
        >
          <Plus className="text-muted-foreground" size={20} />
        </View>
        <View className="min-w-0 flex-1">
          <Text
            className="text-sm text-muted-foreground"
            numberOfLines={1}
          >
            {translate('common.add')}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

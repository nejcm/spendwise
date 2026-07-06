import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from 'tailwind-variants';

import { getPressedStyle, Text } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

export type AddAccountCardProps = {
  onPress: () => void;
};

export function AddAccountCard({ onPress }: AddAccountCardProps) {
  const density = useAppStore.use.density();
  const isCompact = density === 'compact';

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-xl border-2 border-dashed border-border',
        isCompact ? 'p-1' : 'p-3',
      )}
      style={getPressedStyle}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            'items-center justify-center rounded-lg bg-muted/40',
            isCompact ? 'size-10' : 'size-12',
          )}
        >
          <Plus className="text-muted-foreground" size={20} />
        </View>
        <Text
          className="text-sm text-muted-foreground"
          numberOfLines={1}
        >
          {translate('common.add')}
        </Text>
      </View>
    </Pressable>
  );
}

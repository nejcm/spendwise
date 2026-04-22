import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { cn } from 'tailwind-variants';

import { useUniwind } from 'uniwind';
import { Pressable, Text, View } from '@/components/ui';
import { ArrowRight } from '@/components/ui/icon';

type ItemProps = {
  text: TxKeyPath;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  className?: string;
};

export function SettingsItem({ text, value, icon, onPress, className }: ItemProps) {
  const { theme } = useUniwind();
  const isPressable = !!onPress;
  const iconColor = theme === 'dark' ? '#ffffff' : '#232633';

  return (
    <Pressable
      onPress={onPress}
      pointerEvents={isPressable ? 'auto' : 'none'}
      className={cn('flex-1 flex-row items-center justify-between px-4 py-3', className)}
    >
      <View className="flex-row items-center">
        {icon && <View className="mr-2">{icon}</View>}
        <Text tx={text} />
      </View>
      <View className="flex-row items-center">
        <Text className="text-gray-600 dark:text-white">{value}</Text>
        {isPressable && (
          <View className="pl-2">
            <ArrowRight color={iconColor} size={16} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

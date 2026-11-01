import type { PressableProps } from 'react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { getPressedStyle } from './button';
import { ChevronRight } from './icon';
import { Text } from './text';

export type ListRowProps = Omit<PressableProps, 'children'> & {
  title: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  /** Amount, Switch, value text or any custom node, rendered before the chevron. */
  trailing?: React.ReactNode;
  chevron?: boolean;
  className?: string;
};

export function ListRow({ title, meta, icon, trailing, chevron = false, className, onPress, style, ...props }: ListRowProps) {
  return (
    <Pressable
      // Pressable defaults to accessible, which would swallow a trailing Switch/Input into one inert element.
      accessible={!!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={(state) => getPressedStyle(state, style, !!onPress)}
      className={cn('min-h-16 flex-row items-center gap-3 py-2', className)}
      {...props}
    >
      {icon}
      <View className="min-w-0 flex-1">
        {typeof title === 'string' ? <Text className="text-row font-medium" numberOfLines={1}>{title}</Text> : title}
        {typeof meta === 'string' ? <Text className="text-meta text-muted-foreground" numberOfLines={1}>{meta}</Text> : meta}
      </View>
      {trailing}
      {chevron && <ChevronRight size={18} colorClassName="accent-muted-foreground" />}
    </Pressable>
  );
}

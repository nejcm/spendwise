import type { PressableProps } from 'react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/lib/store/store';
import { getPressedStyle } from './button';
import { SwitchIcon } from './checkbox';
import { ChevronRight } from './icon';
import { Text } from './text';

export type ListRowProps = Omit<PressableProps, 'children'> & {
  ref?: React.Ref<View>;
  title: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  /** Amount, value text or any custom node, rendered before the switch/chevron. */
  trailing?: React.ReactNode;
  chevron?: boolean;
  /** Renders a switch and makes the whole row the toggle; pair with `onPress`. */
  checked?: boolean;
  /** Tapping anywhere on the row focuses this input (or opens a DateInput via its `controlRef`). */
  focusInput?: React.RefObject<{ focus: () => void } | null>;
  className?: string;
};

export function ListRow({ title, meta, icon, trailing, chevron = false, checked, focusInput, className, onPress, style, ...props }: ListRowProps) {
  const isCompact = useAppStore.use.density() === 'compact';
  return (
    <Pressable
      // Pressable defaults to accessible, which would swallow a trailing Input/button into one inert element.
      accessible={!!onPress}
      accessibilityRole={checked !== undefined ? 'switch' : onPress ? 'button' : undefined}
      accessibilityState={checked !== undefined ? { checked } : undefined}
      onPress={onPress ?? (focusInput && (() => focusInput.current?.focus()))}
      style={(state) => getPressedStyle(state, style, !!onPress)}
      className={cn('flex-row items-center gap-3', isCompact ? 'min-h-12 py-1' : 'min-h-16 py-2', className)}
      {...props}
    >
      {icon}
      <View className="min-w-0 flex-1">
        {typeof title === 'string' ? <Text className="text-row font-medium" numberOfLines={1}>{title}</Text> : title}
        {typeof meta === 'string' ? <Text className="text-meta text-muted-foreground" numberOfLines={1}>{meta}</Text> : meta}
      </View>
      {trailing}
      {checked !== undefined && <SwitchIcon checked={checked} />}
      {chevron && <ChevronRight size={18} colorClassName="accent-muted-foreground" />}
    </Pressable>
  );
}

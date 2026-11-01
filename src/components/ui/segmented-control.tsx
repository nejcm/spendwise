import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Equal-width segments across the full width; false hugs the labels. */
  fill?: boolean;
  accessibilityLabel?: string;
  className?: string;
};

export function SegmentedControl<T extends string>({ options, value, onChange, fill = true, accessibilityLabel, className }: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      className={cn('flex-row rounded-full bg-segment-track p-1', !fill && 'self-start', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            className={cn('h-[38px] items-center justify-center rounded-full px-4', fill && 'flex-1', selected && 'bg-segment-selected')}
          >
            <Text numberOfLines={1} className={cn('text-sm font-medium', selected ? 'text-foreground' : 'text-muted-foreground')}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

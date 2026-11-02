import * as React from 'react';
import { Pressable, Text } from '@/components/ui';
import { cn } from '@/lib/cn';

export type ChoiceTileProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
};

/** Radio card with a preview; the selected one gets a foreground ring. Wrap a set in a `radiogroup`. */
export function ChoiceTile({ label, selected, onPress, children, className }: ChoiceTileProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={cn('flex-1 gap-2.5 rounded-[18px] border-2 bg-card p-2.5', selected ? 'border-foreground' : 'border-transparent', className)}
    >
      {children}
      <Text className="text-sm font-medium" numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

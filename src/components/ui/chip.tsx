import type { PressableProps } from 'react-native';
import * as React from 'react';
import { Pressable } from 'react-native';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { getPressedStyle } from './button';
import { X } from './icon';
import { Text } from './text';

function renderIcon(icon: React.ReactNode) {
  return typeof icon === 'string' ? <Text className="text-sm">{icon}</Text> : icon;
}

export type ChipProps = Omit<PressableProps, 'children'> & {
  label: string;
  /** Emoji string or node. */
  icon?: React.ReactNode;
  selected?: boolean;
  className?: string;
};

export function Chip({ label, icon, selected = false, className, style, ...props }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={(state) => getPressedStyle(state, style)}
      className={cn(
        'h-[38px] flex-row items-center gap-1.5 self-start rounded-full border pr-3.5 pl-2.5',
        selected ? 'border-accent-line bg-accent-soft' : 'border-transparent bg-card-2',
        className,
      )}
      {...props}
    >
      {renderIcon(icon)}
      <Text className="text-sm font-medium">{label}</Text>
    </Pressable>
  );
}

export type FilterChipProps = Omit<PressableProps, 'children' | 'onPress'> & {
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
  className?: string;
};

export function FilterChip({ label, icon, onRemove, className, style, ...props }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={translate('common.remove_filter', { label })}
      onPress={onRemove}
      hitSlop={4}
      style={(state) => getPressedStyle(state, style)}
      className={cn('h-[34px] flex-row items-center gap-1.5 self-start rounded-full border border-accent-line bg-accent-soft pr-1.5 pl-2.5', className)}
      {...props}
    >
      {renderIcon(icon)}
      <Text className="text-meta font-medium">{label}</Text>
      <X size={16} colorClassName="accent-muted-foreground" />
    </Pressable>
  );
}

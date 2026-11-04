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
  /** `solid` fills the selected chip with primary, for pickers inside sheets. */
  tone?: 'soft' | 'solid';
  size?: 'sm' | 'md';
  className?: string;
};

export function Chip({ label, icon, selected = false, tone = 'soft', size = 'md', className, style, ...props }: ChipProps) {
  const solid = selected && tone === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={(state) => getPressedStyle(state, style)}
      className={cn(
        'flex-row items-center gap-1.5 self-start rounded-full border',
        size === 'sm' ? 'h-8 pr-3 pl-2' : 'h-9.5 pr-3.5 pl-2.5',
        solid ? 'border-transparent bg-primary' : selected ? 'border-accent-line bg-accent-soft' : 'border-transparent bg-card-2',
        className,
      )}
      {...props}
    >
      {renderIcon(icon)}
      <Text className={cn(size === 'sm' ? 'text-xs' : 'text-sm', 'font-medium', solid && 'text-primary-foreground')}>{label}</Text>
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
      className={cn('h-8.5 flex-row items-center gap-1.5 self-start rounded-full border border-accent-line bg-accent-soft pr-1.5 pl-2.5', className)}
      {...props}
    >
      {renderIcon(icon)}
      <Text className="text-meta font-medium">{label}</Text>
      <X size={16} colorClassName="accent-muted-foreground" />
    </Pressable>
  );
}

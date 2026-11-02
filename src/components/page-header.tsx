import type { UniwindLucideIcon } from './ui/icon';
import * as React from 'react';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/lib/store/store';
import { IconButton, Text, View } from './ui';

export type PageHeaderProps = {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Replaces the centred title, e.g. with a period pill. */
  children?: React.ReactNode;
};

export function PageHeader({ title, left, right, children }: PageHeaderProps) {
  const isCompact = useAppStore.use.density() === 'compact';
  const slot = isCompact ? 'w-9' : 'w-11';
  return (
    <View className={cn('flex-row items-center justify-between gap-2', isCompact ? 'h-10' : 'h-12')}>
      <View className={slot}>{left}</View>
      {children ?? <Text accessibilityRole="header" numberOfLines={1} className="min-w-0 flex-1 text-center text-header-title font-semibold">{title}</Text>}
      <View className={slot}>{right}</View>
    </View>
  );
}

export function HeaderButton({ icon: Icon, label, onPress }: { icon: UniwindLucideIcon; label: string; onPress: () => void }) {
  return (
    <IconButton color="secondary" accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <Icon size={20} strokeWidth={2} colorClassName="accent-foreground" />
    </IconButton>
  );
}

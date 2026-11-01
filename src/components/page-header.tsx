import type { UniwindLucideIcon } from './ui/icon';
import * as React from 'react';
import { IconButton, Text, View } from './ui';

export type PageHeaderProps = {
  title?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Replaces the centred title, e.g. with a period pill. */
  children?: React.ReactNode;
};

export function PageHeader({ title, left, right, children }: PageHeaderProps) {
  return (
    <View className="h-12 flex-row items-center justify-between gap-3">
      <View className="w-11">{left}</View>
      {children ?? <Text accessibilityRole="header" numberOfLines={1} className="min-w-0 flex-1 text-center text-header-title font-semibold">{title}</Text>}
      <View className="w-11">{right}</View>
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

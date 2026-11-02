import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  body?: string;
  /** Usually pill buttons; stacked full width. */
  actions?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, body, actions, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center', className)}>
      {icon && <View className="pb-6">{icon}</View>}
      <Text className="text-center text-[22px] font-bold tracking-tight">{title}</Text>
      {!!body && <Text className="max-w-72.5 pt-2 text-center text-row/snug text-foreground-2">{body}</Text>}
      {actions && <View className="w-full gap-2.5 pt-7">{actions}</View>}
    </View>
  );
}

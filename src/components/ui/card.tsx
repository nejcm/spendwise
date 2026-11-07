import type { ViewProps } from 'react-native';
import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/cn';

export type CardProps = ViewProps & {
  className?: string;
  variant?: 'default' | 'hero';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return <View className={cn('overflow-hidden border border-edge bg-card', variant === 'hero' ? 'rounded-hero' : 'rounded-card', className)} {...props} />;
}

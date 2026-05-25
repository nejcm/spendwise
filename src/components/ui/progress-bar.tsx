import * as React from 'react';
import { View } from 'react-native';
import { cn } from 'tailwind-variants';
import { isHexColor } from '@/lib/theme/colors';
import { Text } from './text';

export type ProgressBarProps = {
  /** 0-100 */
  value: number;
  className?: string;
  containerClassName?: string;
  showPercentage?: boolean;
  bg?: string;
  color?: string;
  children?: React.ReactNode;
};

export function ProgressBar({
  value,
  className,
  color,
  containerClassName,
  showPercentage = true,
  bg = 'bg-gray-300 dark:bg-gray-700',
  children,
}: ProgressBarProps) {
  const isHex = isHexColor(color);
  return (
    <View className={cn('flex-row items-center gap-1', containerClassName)}>
      <View className={cn('h-1.5 flex-1 overflow-hidden rounded-full', bg, className)}>
        <View
          className={cn(`h-full rounded-full bg-foreground`, !isHex ? color : undefined)}
          style={{ width: `${value}%`, ...(isHex ? { backgroundColor: color } : {}) }}
        />
      </View>
      {(!!showPercentage || !!children) && (
        <Text className="text-xs/snug text-muted-foreground">
          {!!showPercentage && `${value.toFixed(0)}%`}
          {children}
        </Text>
      )}
    </View>
  );
}

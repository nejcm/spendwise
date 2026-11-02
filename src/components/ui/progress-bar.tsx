import * as React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { cn } from '@/lib/cn';
import { isHexColor } from '@/lib/theme/colors';
import { easeOut } from '@/lib/theme/motion';
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
  bg = 'bg-track',
  children,
}: ProgressBarProps) {
  const isHex = isHexColor(color);
  // Starts at the value so a screen opening doesn't animate; only later changes ease in.
  const width = useSharedValue(value);
  React.useEffect(() => {
    width.value = withTiming(value, { duration: 280, easing: easeOut });
  }, [value, width]);
  const widthStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View className={cn('flex-row items-center gap-1', containerClassName)}>
      <View className={cn('h-1.5 flex-1 overflow-hidden rounded-full', bg, className)}>
        <Animated.View style={[{ height: '100%' }, widthStyle]}>
          <View
            className={cn('h-full rounded-full bg-accent', !isHex ? color : undefined)}
            style={isHex ? { backgroundColor: color } : undefined}
          />
        </Animated.View>
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

import type { Skeleton as MotiSkeleton } from 'moti/skeleton';
import type { DimensionValue } from 'react-native';
import { MotiView, View } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { memo } from 'react';
import { cn } from 'tailwind-variants';
import { useThemeConfig } from '../../lib/theme/use-theme-config';

export type SkeletonContainerProps = {
  className?: string;
  children: (props: Parameters<typeof MotiSkeleton>[0]) => React.ReactNode;
};

const darkGradient = ['#31343b', '#4b4f59', '#31343b'];
const lightGradient = ['#e6e7e8', '#babcbf', '#e6e7e8'];

function SkeletonWrapperComponent({ className, children }: SkeletonContainerProps) {
  const theme = useThemeConfig();

  return (
    <MotiView
      className={className}
      transition={{
        type: 'timing',
        duration: 1500,
        delay: 1000,
      }}
      animate={{ backgroundColor: 'transparent' }}
    >
      {children({ colorMode: theme.dark ? 'dark' : 'light', show: true, width: '100%', height: 18, radius: 8, colors: theme.dark ? darkGradient : lightGradient })}
    </MotiView>
  );
}

export const SkeletonWrapper = memo(SkeletonWrapperComponent);
export default SkeletonWrapper;

export type SkeletonBoxProps = {
  height?: number | DimensionValue;
  width?: number | DimensionValue;
  className?: string;
};

export function SkeletonBox({ height, width, className }: SkeletonBoxProps) {
  return (
    <SkeletonWrapper className={className}>
      {(props) => <View style={{ width }}><Skeleton {...props} height={height} width="100%" /></View>}
    </SkeletonWrapper>
  );
}

export type LoaderDimensions = [number | DimensionValue, number | DimensionValue][];
export type SkeletonRowsProps = {
  count?: number;
  /** Array of [width, height] pairs */
  dimensions?: LoaderDimensions;
  className?: string;
};

const rowDefault: LoaderDimensions = [['100%', 48], ['75%', 32], ['50%', 32], ['100%', 32]];
export function SkeletonRows({ count = 3, dimensions = rowDefault, className }: SkeletonRowsProps) {
  return (
    <SkeletonWrapper className={cn('flex-col gap-2', className)}>
      {(props) => (
        <>
          {Array.from({ length: count }, (_, i) => (
            <View key={i} style={{ width: dimensions[i % dimensions.length][0] }}>
              <Skeleton key={i} {...props} height={dimensions[i % dimensions.length][1]} width="100%" />
            </View>
          ))}
        </>
      )}
    </SkeletonWrapper>
  );
}

export type SkeletonGridProps = {
  cols: number;
  rows: number;
  className?: string;
  heights?: (number | DimensionValue)[];
};
const gridDefault: (number | DimensionValue)[] = [100, 100];
export function SkeletonGrid({ cols = 2, rows = 3, className, heights = gridDefault }: SkeletonGridProps) {
  return (

    <SkeletonWrapper className={cn(`flex-1 flex-row flex-wrap justify-between gap-y-2`, className)}>
      {(props) => (
        <>
          {Array.from({ length: cols * rows }, (_, i) => (
            <View key={i} style={{ width: `${(100 / cols) - 1}%` }}>
              <Skeleton key={i} {...props} height={heights[i % heights.length]} width="100%" />
            </View>
          ))}
        </>
      )}
    </SkeletonWrapper>
  );
}

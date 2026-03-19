import type { Skeleton as MotiSkeleton } from 'moti/skeleton';
import { MotiView } from 'moti';
import { memo } from 'react';
import { useThemeConfig } from '../../lib/theme/use-theme-config';

export type SkeletonContainerProps = {
  className?: string;
  children: (props: Parameters<typeof MotiSkeleton>[0]) => React.ReactNode;
};

const darkGradient = ['#31343b', '#4b4f59', '#31343b'];
const lightGradient = ['#e6e7e8', '#babcbf', '#e6e7e8'];

function SkeletonContainer({ className, children }: SkeletonContainerProps) {
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

export default memo(SkeletonContainer);

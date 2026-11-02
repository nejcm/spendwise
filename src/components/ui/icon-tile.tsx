import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { View } from 'react-native';
import { tv } from '@/lib/cn';
import { hexWithOpacity } from '@/lib/theme/colors';
import { Text } from './text';

const iconTile = tv({
  slots: {
    base: 'items-center justify-center overflow-hidden bg-card-2',
    emoji: 'text-center',
  },
  variants: {
    size: {
      sm: { base: 'size-10 rounded-xl', emoji: 'text-lg' },
      md: { base: 'size-10.5 rounded-xl', emoji: 'text-[19px]' },
      lg: { base: 'size-11.5 rounded-tile', emoji: 'text-xl' },
    },
  },
  defaultVariants: { size: 'md' },
});

export type IconTileProps = VariantProps<typeof iconTile> & {
  /** Hex hue; the tile shows it at ~15% alpha. */
  color?: string | null;
  icon?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function IconTile({ color, icon, size, className, children }: IconTileProps) {
  const styles = iconTile({ size });
  return (
    <View className={styles.base({ className })} style={{ backgroundColor: hexWithOpacity(color, 26) }}>
      {children ?? <Text className={styles.emoji()}>{icon}</Text>}
    </View>
  );
}

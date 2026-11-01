import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { Text } from './text';

export type SectionHeaderProps = {
  title: string;
  onSeeAll?: () => void;
  /** Defaults to "See all". */
  actionLabel?: string;
  className?: string;
};

export function SectionHeader({ title, onSeeAll, actionLabel, className }: SectionHeaderProps) {
  return (
    <View className={cn('flex-row items-center justify-between px-1 pt-5 pb-2', className)}>
      <Text accessibilityRole="header" className="text-meta font-medium text-muted-foreground">{title}</Text>
      {onSeeAll && (
        <Pressable accessibilityRole="button" onPress={onSeeAll} hitSlop={8}>
          <Text className="text-sm text-muted-foreground">{actionLabel ?? translate('common.seeAll')}</Text>
        </Pressable>
      )}
    </View>
  );
}

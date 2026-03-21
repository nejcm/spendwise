import type { UniwindLucideIcon } from '@/components/ui/icon';
import { Pressable } from 'react-native';

import { cn } from 'tailwind-variants';
import { Plus } from '@/components/ui/icon';
import { Text, View } from './ui';

export interface NoDataCardProps {
  onPress: () => void;
  label: string;
  description?: string;
  icon?: UniwindLucideIcon;
  className?: string;
  children?: React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
export const cardClassName = 'rounded-xl border-2 border-dashed border-gray-300 p-4 dark:border-gray-500';

export function NoDataCard({ children, onPress, label, description, icon: Icon = Plus, className }: NoDataCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(cardClassName, className)}
    >
      <View className="flex-1 justify-center gap-2">
        <View className="flex-row items-center justify-center gap-2">
          <Icon className="size-5 text-muted-foreground" />
          <Text className="font-medium text-muted-foreground">
            {label}
          </Text>
        </View>
        {!!description && (
          <Text className="text-center text-sm/snug text-muted-foreground/75">
            {description}
          </Text>
        )}
        {children}
      </View>
    </Pressable>
  );
}

import type { LucideIcon } from 'lucide-react-native';
import { Plus } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { cn } from 'tailwind-variants';
import { Text, View } from './ui';

export interface NoDataCardProps {
  onPress: () => void;
  label: string;
  description?: string;
  icon?: LucideIcon;
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
          <Icon className="text-muted-foreground size-5" />
          <Text className="text-muted-foreground font-medium">
            {label}
          </Text>
        </View>
        {!!description && (
          <Text className="text-muted-foreground/75 text-center text-sm/snug">
            {description}
          </Text>
        )}
        {children}
      </View>
    </Pressable>
  );
}

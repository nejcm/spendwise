import { cn } from 'tailwind-variants';
import { DatabaseSearch } from '@/components/ui/icon';
import { Text, View } from './ui';

export interface NoDataProps {
  icon?: boolean;
  title: string;
  description?: string;
  className?: string;
  horizontal?: boolean;
  children?: React.ReactNode;
}

export default function NoData({ icon = true, title, description, className, horizontal = false, children }: NoDataProps) {
  const textAlign = horizontal ? '' : 'text-center';
  return (
    <View className={cn('items-center justify-center', horizontal ? 'flex-row gap-3' : 'flex-col gap-2', className)}>
      {icon && <DatabaseSearch size={horizontal ? 50 : 100} className={`text-muted-foreground ${horizontal ? '' : 'mx-auto mb-2'}`} />}
      <Text className={`font-medium text-muted-foreground ${textAlign} ${horizontal ? '' : 'text-lg'}`}>{title}</Text>
      {!!description && <Text className={`text-sm text-muted-foreground ${textAlign}`}>{description}</Text>}
      {children}
    </View>
  );
}

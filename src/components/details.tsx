import { cn } from 'tailwind-variants';
import { Text, View } from './ui';

export type DetailsRowProps = {
  label: string;
  labelClassName?: string;
  description?: string;
  value: string | React.ReactNode;
  className?: string;
  sectionClassName?: string;
  growSide?: 'left' | 'right';
};

export function DetailsRow({ label, labelClassName, description, value, className, sectionClassName, growSide = 'left' }: DetailsRowProps) {
  return (
    <View className={cn('flex-row items-start gap-3', sectionClassName)}>
      <View className={`min-w-20 ${growSide === 'left' ? 'flex-1' : ''}`}>
        <Text className={cn(description ? 'text-foreground' : 'text-muted-foreground', labelClassName)}>{label}</Text>
        {!!description && <Text className="text-sm/snug text-muted-foreground">{description}</Text>}
      </View>
      <View className={`min-w-0 items-end ${growSide === 'right' ? 'flex-1' : ''}`}>
        {typeof value === 'string' ? <Text className={cn('text-right text-foreground', className)}>{value}</Text> : value}
      </View>
    </View>
  );
}

export type DetailsSectionProps = {
  className?: string;
  data: DetailsRowProps[];
  children?: React.ReactNode;
  growSide?: 'left' | 'right';
};

export default function DetailsSection({ className, data, children, growSide = 'left' }: DetailsSectionProps) {
  return (
    <View className={cn('gap-3 rounded-xl bg-card p-4', className)}>
      {data.map((row, index) => (
        <DetailsRow key={index} growSide={growSide} {...row} />
      ))}
      {children}
    </View>
  );
}

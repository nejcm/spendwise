import { cn } from 'tailwind-variants';
import { Text, View } from './ui';

export type DetailsRowProps = {
  label: string;
  labelClassName?: string;
  description?: string;
  value: string | React.ReactNode;
  className?: string;
  sectionClassName?: string;
};

export function DetailsRow({ label, labelClassName, description, value, className, sectionClassName }: DetailsRowProps) {
  return (
    <View className={cn('flex-row items-center justify-between gap-4', sectionClassName)}>
      <View className="min-w-20 flex-1">
        <Text className={cn(description ? 'text-foreground' : 'text-muted-foreground', labelClassName)}>{label}</Text>
        {!!description && <Text className="text-sm/snug text-muted-foreground">{description}</Text>}
      </View>
      {typeof value === 'string' ? <Text className={cn('text-foreground', className)}>{value}</Text> : value}
    </View>
  );
}

export type DetailsSectionProps = {
  className?: string;
  data: DetailsRowProps[];
  children?: React.ReactNode;
};

export default function DetailsSection({ className, data, children }: DetailsSectionProps) {
  return (
    <View className={cn('gap-4 rounded-xl bg-card p-4', className)}>
      {data.map((row, index) => (
        <DetailsRow key={index} {...row} />
      ))}
      {children}
    </View>
  );
}

import { cn } from 'tailwind-variants';
import { Text, View } from './ui';

export type DetailsRowProps = {
  label: string;
  labelClassName?: string;
  description?: string;
  value: string | React.ReactNode;
  className?: string;
};

export function DetailsRow({ label, labelClassName, description, value, className }: DetailsRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <View className="flex-1">
        <Text className={cn('text-muted-foreground', labelClassName)}>{label}</Text>
        {!!description && <Text className="text-muted-foreground mt-0.5 text-sm/snug">{description}</Text>}
      </View>
      {typeof value === 'string' ? <Text className={cn('text-foreground', className)}>{value}</Text> : value}
    </View>
  );
}

export type DetailsSectionProps = {
  className?: string;
  data: DetailsRowProps[];
};

export default function DetailsSection({ className, data }: DetailsSectionProps) {
  return (
    <View className={cn('bg-card gap-4 rounded-xl p-4', className)}>
      {data.map((row, index) => (
        <DetailsRow key={index} {...row} />
      )) }
    </View>
  );
}

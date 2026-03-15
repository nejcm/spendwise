import { cn } from 'tailwind-variants';
import { Text, View } from './ui';

export type DetailsRowProps = {
  label: string;
  value: string;
  className?: string;
};

export function DetailsRow({ label, value, className }: DetailsRowProps) {
  return (
    <View className="flex-row justify-between gap-2">
      <Text className="text-muted-foreground">{label}</Text>
      <Text className={cn('text-foreground', className)}>{value}</Text>
    </View>
  );
}

export type DetailsSectionProps = {
  className?: string;
  data: DetailsRowProps[];
};

export default function DetailsSection({ className, data }: DetailsSectionProps) {
  return (
    <View className={cn('gap-4 rounded-xl bg-card p-4', className)}>
      {data.map((row, index) => (
        <DetailsRow key={index} {...row} />
      )) }
    </View>
  );
}

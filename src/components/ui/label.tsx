import { cn } from 'tailwind-variants';
import { Text } from './text';

export type LabelProps = {
  className?: string;
  children: React.ReactNode;
};

const labelDefaults = 'font-family-sans text-xs/snug font-medium tracking-[0.03rem] uppercase';

export function Label({ className, children }: LabelProps) {
  return (
    <Text className={cn(labelDefaults, className)}>
      {children}
    </Text>
  );
}

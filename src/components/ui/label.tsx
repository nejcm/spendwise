import { cn } from 'tailwind-variants';
import { Text } from './text';

export type LabelProps = {
  className?: string;
  children: React.ReactNode;
};

const labelDefaults = 'font-family-sans text-[11px]/snug font-medium tracking-[0.045rem] uppercase';

export function Label({ className, children }: LabelProps) {
  return (
    <Text className={cn(labelDefaults, className)}>
      {children}
    </Text>
  );
}

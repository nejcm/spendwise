import { cn } from '@/lib/cn';
import { Text } from './text';

export type LabelProps = {
  className?: string;
  children: React.ReactNode;
};

const labelDefaults = 'font-sans text-[11px]/snug font-medium tracking-[0.045rem] uppercase';

export function Label({ className, children }: LabelProps) {
  return (
    <Text className={cn(labelDefaults, className)}>
      {children}
    </Text>
  );
}

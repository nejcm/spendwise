import * as React from 'react';
import { ListRow, Text } from '@/components/ui';
import { cn } from '@/lib/cn';

export type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function ToggleRow({ title, description, checked, onChange, className }: ToggleRowProps) {
  return (
    <ListRow
      className={cn('gap-4 py-3.5', className)}
      title={<Text className="text-row font-medium">{title}</Text>}
      meta={<Text className="text-meta text-muted-foreground">{description}</Text>}
      checked={checked}
      onPress={() => onChange(!checked)}
      accessibilityLabel={title}
      accessibilityHint={description}
    />
  );
}

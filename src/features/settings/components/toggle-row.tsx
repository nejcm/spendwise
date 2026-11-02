import * as React from 'react';
import { ListRow, Switch, Text } from '@/components/ui';
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
      trailing={<Switch accessibilityLabel={title} accessibilityHint={description} checked={checked} onChange={onChange} />}
    />
  );
}

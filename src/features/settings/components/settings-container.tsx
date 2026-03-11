import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { cn } from 'tailwind-variants';
import { Text, View } from '@/components/ui';

type Props = {
  children: React.ReactNode;
  title?: TxKeyPath;
  className?: string;
};

export function SettingsContainer({ children, title, className }: Props) {
  return (
    <>
      {title && <Text className="mb-2 pt-6 font-bold" tx={title} />}
      <View className={cn('rounded-xl bg-neutral-100 py-1 dark:bg-neutral-800', className)}>
        {children}
      </View>
    </>
  );
}

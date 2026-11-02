import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { Text, View } from '@/components/ui';
import { cn } from '@/lib/cn';

type Props = {
  children: React.ReactNode;
  title?: TxKeyPath;
  className?: string;
};

export function SettingsContainer({ children, title, className }: Props) {
  return (
    <>
      {title && <Text className="mb-2 font-bold dark:text-muted-foreground" tx={title} />}
      <View className={cn('mb-6 rounded-xl bg-card py-1', className)}>
        {children}
      </View>
    </>
  );
}

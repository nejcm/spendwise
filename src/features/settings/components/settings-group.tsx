import type { UniwindLucideIcon } from '@/components/ui/icon';
import * as React from 'react';
import { Card, IconTile, ListRow, SectionHeader, Text, View } from '@/components/ui';
import { cn } from '@/lib/cn';

export type SettingsRow = {
  key: string;
  icon: UniwindLucideIcon;
  title: string;
  meta?: string | null;
  danger?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
};

export function SettingsGroup({ title, rows }: { title: string; rows: SettingsRow[] }) {
  return (
    <View>
      <SectionHeader title={title} />
      <Card className="px-[18px]">
        {rows.map((row, index) => (
          <ListRow
            key={row.key}
            className={cn(index > 0 && 'border-t border-border')}
            icon={(
              <IconTile size="sm">
                <row.icon size={20} colorClassName={row.danger ? 'accent-negative' : 'accent-foreground'} />
              </IconTile>
            )}
            title={row.danger ? <Text className="text-row font-medium text-negative">{row.title}</Text> : row.title}
            meta={row.meta ?? undefined}
            trailing={row.trailing}
            chevron={!!row.onPress}
            onPress={row.onPress}
          />
        ))}
      </Card>
    </View>
  );
}

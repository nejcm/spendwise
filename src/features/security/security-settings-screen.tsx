import * as React from 'react';
import { Card, ListRow, Text } from '@/components/ui';
import { Check } from '@/components/ui/icon';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { setLockTimeoutMinutes, useAppStore } from '@/lib/store/store';
import { LOCK_TIMEOUT_MINUTES, lockTimeoutLabel } from './app-lock';

export function SecuritySettingsScreen() {
  const lockTimeoutMinutes = useAppStore.use.lockTimeoutMinutes();

  return (
    <SettingsPage title={translate('security.lock_after')}>
      <Card accessibilityRole="radiogroup" accessibilityLabel={translate('security.lock_after')} className="mt-5 px-4">
        {LOCK_TIMEOUT_MINUTES.map((minutes, index) => {
          const selected = minutes === lockTimeoutMinutes;
          return (
            <ListRow
              key={minutes}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={cn('min-h-12.5', index > 0 && 'border-t border-border')}
              title={lockTimeoutLabel(minutes)}
              trailing={selected && <Check size={20} strokeWidth={2.4} colorClassName="accent-accent" />}
              onPress={() => setLockTimeoutMinutes(minutes)}
            />
          );
        })}
      </Card>
      <Text className="px-1 pt-2.5 text-meta text-muted-foreground">{translate('security.lock_after_note')}</Text>
    </SettingsPage>
  );
}

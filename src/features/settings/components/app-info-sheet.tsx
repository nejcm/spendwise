import type { useModalSheet } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import Env from 'env';

import * as React from 'react';
import { ModalSheet, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useSQLiteContext } from '@/lib/sqlite';

export function AppInfoSheet({ modal }: { modal: ReturnType<typeof useModalSheet> }) {
  const db = useSQLiteContext();
  const { data } = useQuery({
    queryKey: ['settings', 'appInfo'],
    queryFn: async () => {
      const [userVersionRow, sqliteVersionRow] = await Promise.all([
        db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
        db.getFirstAsync<{ v: string }>('select sqlite_version() as v'),
      ]);

      return {
        dbUserVersion: userVersionRow?.user_version ?? 0,
        sqliteVersion: sqliteVersionRow?.v ?? null,
      };
    },
  });

  const dbUserVersionDisplay = data ? String(data.dbUserVersion) : '—';
  const sqliteVersionDisplay = data?.sqliteVersion ?? '—';

  return (
    <ModalSheet
      ref={modal.ref}
      title={translate('settings.app_info')}
      onDismiss={modal.close}
      snapPoints={['55%']}
    >
      <View className="flex-1 px-4 pb-10">
        <View className="gap-3 pt-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{translate('settings.app_version')}</Text>
            <Text className="text-sm text-foreground">{`${Env.EXPO_PUBLIC_NAME} v${Env.EXPO_PUBLIC_VERSION}`}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{translate('settings.app_env')}</Text>
            <Text className="text-sm text-foreground">{Env.EXPO_PUBLIC_APP_ENV}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{translate('settings.sqlite_version')}</Text>
            <Text className="text-sm text-foreground">{sqliteVersionDisplay}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{translate('settings.db_version')}</Text>
            <Text className="text-sm text-foreground">{dbUserVersionDisplay}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{translate('settings.bundle_id')}</Text>
            <Text className="text-sm text-foreground">{Env.EXPO_PUBLIC_BUNDLE_ID}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{translate('settings.package')}</Text>
            <Text className="text-sm text-foreground">{Env.EXPO_PUBLIC_PACKAGE}</Text>
          </View>
        </View>
      </View>
    </ModalSheet>
  );
}

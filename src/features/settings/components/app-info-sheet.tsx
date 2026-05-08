import type { useModalSheet } from '@/components/ui';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useQuery } from '@tanstack/react-query';

import Env from 'env';
import * as React from 'react';
import { GhostButton, ModalSheet, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useSQLiteContext } from '@/lib/sqlite';
import { updateAppState } from '@/lib/store/store';

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

  return (
    <ModalSheet
      ref={modal.ref}
      title={translate('settings.app_info')}
      onDismiss={modal.close}
      snapPoints={['55%']}
    >
      <BottomSheetScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="gap-3 px-4 pt-2">
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
            <Text className="text-sm text-foreground">{data?.sqliteVersion ?? '-'}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">{translate('settings.db_version')}</Text>
            <Text className="text-sm text-foreground">{data?.dbUserVersion ?? '-'}</Text>
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
        <View className="flex-row items-center justify-center px-4 pt-6">
          <GhostButton
            label={translate('settings.show_intro')}
            onPress={() => updateAppState({ isFirstTime: true })}
            textClassName="underline"
            size="sm"
          />
        </View>
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

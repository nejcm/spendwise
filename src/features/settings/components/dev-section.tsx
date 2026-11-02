import { useQueryClient } from '@tanstack/react-query';
import Env from 'env';

import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { Database, DatabaseBackupIcon, DatabaseZap, Printer } from '@/components/ui/icon';
import { clearData, dumpDbTables, resetDb, seedData, seedMockData } from '@/lib/dev';
import { translate } from '@/lib/i18n';
import { clearAppStore } from '@/lib/store/store';
import { SettingsGroup } from './settings-group';

export default function DevSection() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  if (Env.EXPO_PUBLIC_APP_ENV !== 'development') return null;
  return (
    <SettingsGroup
      title={translate('settings.dev')}
      rows={[
        { key: 'reset_storage', icon: DatabaseBackupIcon, title: translate('settings.reset_storage'), onPress: () => clearAppStore() },
        { key: 'reset_db', icon: DatabaseBackupIcon, title: translate('settings.reset_db'), onPress: () => resetDb(db, queryClient) },
        { key: 'clear', icon: DatabaseZap, title: translate('settings.clear'), onPress: () => clearData(db, queryClient) },
        { key: 'seed', icon: DatabaseZap, title: translate('settings.seed'), onPress: () => seedData(db, queryClient) },
        { key: 'mock_data', icon: Database, title: translate('settings.mock_data'), onPress: () => seedMockData(db, queryClient) },
        { key: 'dump_db', icon: Printer, title: translate('settings.dump_db'), onPress: () => dumpDbTables(db) },
      ]}
    />
  );
}

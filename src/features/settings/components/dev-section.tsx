import { useQueryClient } from '@tanstack/react-query';
import Env from 'env';

import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { Database, DatabaseBackupIcon, DatabaseZap, Printer } from '@/components/ui/icon';
import { clearData, dumpDbTables, resetDb, seedData, seedMockData } from '@/lib/dev';
import { clearAppStore } from '@/lib/store/store';
import { SettingsContainer } from './settings-container';
import { SettingsItem } from './settings-item';

const iconColor = 'accent-foreground';

export default function DevSection() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  if (Env.EXPO_PUBLIC_APP_ENV !== 'development') return null;
  return (
    <SettingsContainer title="settings.dev">
      <SettingsItem text="settings.reset_storage" icon={<DatabaseBackupIcon colorClassName={iconColor} size={20} />} onPress={() => clearAppStore()} />
      <SettingsItem text="settings.reset_db" icon={<DatabaseBackupIcon colorClassName={iconColor} size={20} />} onPress={() => resetDb(db, queryClient)} />
      <SettingsItem text="settings.clear" icon={<DatabaseZap colorClassName={iconColor} size={20} />} onPress={() => clearData(db, queryClient)} />
      <SettingsItem text="settings.seed" icon={<DatabaseZap colorClassName={iconColor} size={20} />} onPress={() => seedData(db, queryClient)} />
      <SettingsItem
        text="settings.mock_data"
        icon={<Database colorClassName={iconColor} size={20} />}
        onPress={() => seedMockData(db, queryClient)}
      />
      <SettingsItem text="settings.dump_db" icon={<Printer colorClassName={iconColor} size={20} />} onPress={() => dumpDbTables(db)} />
    </SettingsContainer>
  );
}

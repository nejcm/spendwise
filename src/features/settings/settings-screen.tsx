import { useQueryClient } from '@tanstack/react-query';
import Env from 'env';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { FocusAwareStatusBar, Image, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { ALargeSmall, Banknote, Bell, Bot, Database, DatabaseBackupIcon, DatabaseZap, HelpCircle, Import, LayoutGrid, Link, ListChecks, PieChart, Printer, RefreshCcw, Share, Shield, User } from '@/components/ui/icon';
import { config } from '@/config';
import { clearData, dumpDbTables, resetDb, seedMockData } from '@/lib/dev';
import { selectProfile, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { getAvatar } from '../profile';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

const iconColor = 'text-foreground';

export function SettingsScreen() {
  const router = useRouter();
  const profile = useAppStore(selectProfile);
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="pb-12" style={defaultStyles.transparentBg}>
        <View className="flex-1 px-4 pt-16">

          <GhostButton className="mx-auto mb-2 h-auto flex-col justify-center" onPress={() => router.push('/settings/profile')}>
            <Image source={getAvatar(profile.avatar)} className="mb-3 size-18 rounded-full" />
            <Text className="text-center">{profile.name}</Text>
          </GhostButton>

          <SettingsContainer title="settings.finance">
            <SettingsItem
              icon={<Banknote className={iconColor} size={20} />}
              text="settings.accounts"
              onPress={() => router.push('/accounts')}
            />
            <SettingsItem
              icon={<LayoutGrid className={iconColor} size={20} />}
              text="settings.categories"
              onPress={() => router.push({ pathname: '/categories' })}
            />
            <SettingsItem
              icon={<PieChart className={iconColor} size={20} />}
              text="settings.stats"
              onPress={() => router.push({ pathname: '/stats' })}
            />
            <SettingsItem
              icon={<ListChecks className={iconColor} size={20} />}
              text="settings.transactions"
              onPress={() => router.push('/transactions')}
            />
            <SettingsItem
              icon={<RefreshCcw className={iconColor} size={20} />}
              text="settings.scheduled"
              onPress={() => router.push('/scheduled' as never)}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.generale">
            <SettingsItem
              icon={<User className={iconColor} size={20} />}
              text="settings.profile"
              onPress={() => router.push('/settings/profile')}
            />
            <SettingsItem
              icon={<Bot className={iconColor} size={20} />}
              text="settings.ai"
              onPress={() => router.push('/settings/ai')}
            />
            <SettingsItem
              icon={<Bell className={iconColor} size={20} />}
              text="settings.notifications"
              onPress={() => router.push('/settings/notifications')}
            />
            <SettingsItem
              icon={<Shield className={iconColor} size={20} />}
              text="settings.security"
              onPress={() => router.push('/settings/security')}
            />
            <SettingsItem
              icon={<ALargeSmall className={iconColor} size={20} />}
              text="settings.formatting"
              onPress={() => router.push('/settings/formatting')}
            />
            <SettingsItem
              icon={<Import className={iconColor} size={20} />}
              text="settings.import"
              onPress={() => router.push('/settings/import-export')}
            />
            <LanguageItem />
            <ThemeItem />
          </SettingsContainer>

          <SettingsContainer title="settings.about">
            <SettingsItem text="settings.app_name" value={Env.EXPO_PUBLIC_NAME} />
            <SettingsItem text="settings.version" value={Env.EXPO_PUBLIC_VERSION} />
          </SettingsContainer>

          <SettingsContainer title="settings.support_us">
            <SettingsItem text="settings.share" icon={<Share className={iconColor} size={20} />} onPress={() => Linking.openURL(config.links.support)} />
            <SettingsItem
              text="settings.support"
              icon={<HelpCircle className={iconColor} size={20} />}
              onPress={() => Linking.openURL(config.links.support)}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.links">
            <SettingsItem
              text="settings.privacy"
              icon={<Link className={iconColor} size={20} />}
              onPress={() => router.push('/settings/privacy')}
            />
            <SettingsItem
              text="settings.terms"
              icon={<Link className={iconColor} size={20} />}
              onPress={() => router.push('/settings/terms')}
            />
          </SettingsContainer>

          {Env.EXPO_PUBLIC_APP_ENV === 'development' && (
            <SettingsContainer title="settings.dev">
              <SettingsItem text="settings.clear" icon={<DatabaseZap className={iconColor} size={20} />} onPress={() => clearData(db, queryClient)} />
              <SettingsItem text="settings.reset" icon={<DatabaseBackupIcon className={iconColor} size={20} />} onPress={() => resetDb(db, queryClient)} />
              <SettingsItem
                text="settings.mock_data"
                icon={<Database className={iconColor} size={20} />}
                onPress={() => seedMockData(db, queryClient)}
              />
              <SettingsItem text="settings.dump_db" icon={<Printer className={iconColor} size={20} />} onPress={() => dumpDbTables(db)} />
            </SettingsContainer>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useQueryClient } from '@tanstack/react-query';
import Env from 'env';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ALargeSmall, Banknote, Bell, FileText, HelpCircle, Import, LayoutGrid, Link, List, LogOut, Share, Shield, User } from 'lucide-react-native';
import { Button, FocusAwareStatusBar, Image, ScrollView, Text, View } from '@/components/ui';
import { config } from '@/config';
import { mockData } from '@/lib/sqlite/mock-data';
import { selectProfile, setIsFirstTime, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { seedDefaults } from '../../lib/sqlite/seed';
import { getAvatar } from '../profile';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

const iconColor = 'text-foreground';

async function seedMockData(db: SQLiteDatabase, queryClient: QueryClient) {
  try {
    await seedDefaults(db);
    await mockData(db);
    console.log('Mock data import successfully');
  }
  catch (err) {
    console.error('Failed to import mock data', err);
  }
  queryClient.clear();
  queryClient.invalidateQueries();
}

export function SettingsScreen() {
  const router = useRouter();
  const profile = useAppStore(selectProfile);
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="pb-12" style={defaultStyles.transparentBg}>
        <View className="flex-1 px-4 pt-16">

          <Button variant="unstyled" className="mx-auto mb-2 h-auto flex-col items-center justify-center" onPress={() => router.push('/settings/profile')}>
            <Image source={getAvatar(profile.avatar)} className="mb-3 size-18 rounded-full" />
            <Text className="text-center">{profile.name}</Text>
          </Button>

          <SettingsContainer title="settings.finance">
            <SettingsItem
              icon={<Banknote className={iconColor} size={20} />}
              text="settings.accounts"
              onPress={() => router.push('/accounts')}
            />
            <SettingsItem
              icon={<LayoutGrid className={iconColor} size={20} />}
              text="settings.categories"
              onPress={() => router.push('/categories')}
            />
            <SettingsItem
              icon={<List className={iconColor} size={20} />}
              text="settings.transactions"
              onPress={() => router.push('/transactions')}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.generale">
            <SettingsItem
              icon={<User className={iconColor} size={20} />}
              text="settings.profile"
              onPress={() => router.push('/settings/profile')}
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
              onPress={() => router.push('/import')}
            />
            <LanguageItem />
            <ThemeItem />
          </SettingsContainer>

          <SettingsContainer title="settings.about">
            <SettingsItem text="settings.app_name" value={Env.EXPO_PUBLIC_NAME} />
            <SettingsItem text="settings.version" value={Env.EXPO_PUBLIC_VERSION} />
          </SettingsContainer>

          <SettingsContainer title="settings.support_us">
            <SettingsItem text="settings.share" icon={<Share className={iconColor} size={20} />} onPress={() => {}} />
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
              <SettingsItem text="settings.reset" icon={<LogOut className={iconColor} size={20} />} onPress={() => setIsFirstTime(true)} />
              <SettingsItem
                text="settings.mock_data"
                icon={<FileText className={iconColor} size={20} />}
                onPress={() => seedMockData(db, queryClient)}
              />
            </SettingsContainer>
          )}

        </View>
      </ScrollView>
    </>
  );
}

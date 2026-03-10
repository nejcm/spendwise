import Env from 'env';
import { useRouter } from 'expo-router';
import { useUniwind } from 'uniwind';

import { colors, FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';
import { Share, Support } from '@/components/ui/icons';
import { translate } from '@/lib/i18n';
import { useIsFirstTime } from '../../lib/hooks';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

export function SettingsScreen() {
  const { theme } = useUniwind();
  const router = useRouter();
  const iconColor = theme === 'dark' ? colors.neutral[400] : colors.neutral[500];
  const [, setFirstTime] = useIsFirstTime();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="pb-12">
        <View className="flex-1 px-4 pt-16">
          <Text className="text-xl font-bold">{translate('settings.title')}</Text>

          <SettingsContainer title="settings.finance">
            <SettingsItem
              text="settings.accounts"
              onPress={() => router.push('/settings/accounts' as any)}
            />
            <SettingsItem
              text="settings.categories"
              onPress={() => router.push('/settings/categories' as any)}
            />
            <SettingsItem
              text="settings.transfer"
              onPress={() => router.push('/settings/transfer' as any)}
            />
            <SettingsItem
              text="settings.subscriptions"
              onPress={() => router.push('/settings/subscriptions' as any)}
            />
            <SettingsItem
              text="settings.security"
              onPress={() => router.push('/settings/security' as any)}
            />
            <SettingsItem
              text="settings.import"
              onPress={() => router.push('/import' as any)}
            />
          </SettingsContainer>

          <SettingsContainer title="settings.generale">
            <LanguageItem />
            <ThemeItem />
          </SettingsContainer>

          <SettingsContainer title="settings.about">
            <SettingsItem text="settings.app_name" value={Env.EXPO_PUBLIC_NAME} />
            <SettingsItem text="settings.version" value={Env.EXPO_PUBLIC_VERSION} />
          </SettingsContainer>

          <SettingsContainer title="settings.support_us">
            <SettingsItem text="settings.share" icon={<Share color={iconColor} />} onPress={() => {}} />
            <SettingsItem text="settings.support" icon={<Support color={iconColor} />} onPress={() => {}} />
          </SettingsContainer>

          <SettingsContainer title="settings.links">
            <SettingsItem text="settings.privacy" onPress={() => {}} />
            <SettingsItem text="settings.terms" onPress={() => {}} />
          </SettingsContainer>

          {Env.EXPO_PUBLIC_APP_ENV === 'development' && (
            <SettingsContainer title="settings.dev">
              <SettingsItem text="settings.reset" onPress={() => setFirstTime(true)} />
            </SettingsContainer>
          )}

        </View>
      </ScrollView>
    </>
  );
}

import Env from 'env';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { FocusAwareStatusBar, Image, ScrollView, Text, useModalSheet, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { ALargeSmall, Banknote, Bell, Bot, BotMessageSquare, DatabaseZap, HelpCircle, Import, LayoutGrid, Link, ListChecks, PieChart, RefreshCcw, ScanLine, Settings, Share, Shield, User } from '@/components/ui/icon';
import { config } from '@/config';
import { triggerScanPicker } from '@/lib/local-store';
import { selectProfile, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { getAvatar } from '../profile';
import { CurrencyItem } from './components/currency-item';
import { DeleteDataSheet } from './components/delete-data-sheet';
import DevSection from './components/dev-section';
import { LanguageItem } from './components/language-item';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';
import { ThemeItem } from './components/theme-item';

const iconColor = 'text-foreground';

export function SettingsScreen() {
  const router = useRouter();
  const profile = useAppStore(selectProfile);
  const deleteModal = useModalSheet();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="pb-12" style={defaultStyles.transparentBg}>
        <View className="flex-1 px-4 pt-16 pb-8">

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
            <SettingsItem
              icon={<BotMessageSquare className={iconColor} size={20} />}
              text="settings.ai_chat"
              onPress={() => router.push('/ai' as never)}
            />
            <SettingsItem
              icon={<ScanLine className={iconColor} size={20} />}
              text="settings.scan"
              onPress={triggerScanPicker}
            />
          </SettingsContainer>

          <SettingsContainer title="common.settings">
            <SettingsItem
              icon={<User className={iconColor} size={20} />}
              text="settings.profile"
              onPress={() => router.push('/settings/profile')}
            />
            <SettingsItem
              icon={<Settings className={iconColor} size={20} />}
              text="settings.general"
              onPress={() => router.push('/settings/general')}
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
            <SettingsItem
              text="settings.delete_data"
              icon={<DatabaseZap className={iconColor} size={20} />}
              onPress={() => deleteModal.present()}
            />
            <LanguageItem />
            <CurrencyItem />
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
          <DevSection />
        </View>
      </ScrollView>
      <DeleteDataSheet ref={deleteModal.ref} />
    </>
  );
}

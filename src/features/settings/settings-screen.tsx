import type { OptionType } from '@/components/ui';
import type { UniwindLucideIcon } from '@/components/ui/icon';
import type { Language } from '@/features/languages/types';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { Card, FocusAwareStatusBar, IconTile, ListRow, Options, ScrollView, SectionHeader, Switch, Text, useModalSheet, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import {
  ALargeSmall,
  Banknote,
  Bell,
  Bot,
  Bug,
  ChevronLeft,
  DatabaseZap,
  FileText,
  Globe,
  Heart,
  Import,
  LayoutGrid,
  Lightbulb,
  Lock,
  Paintbrush,
  RefreshCcw,
  Settings,
  Shield,
  Timer,
} from '@/components/ui/icon';
import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { config } from '@/config';
import { formatCurrency, formatInstant } from '@/features/formatting/helpers';
import { LANGUAGES_OPTIONS } from '@/features/languages';
import { notificationsQuery } from '@/features/notifications/notifications';
import { LOCK_TIMEOUT_OPTIONS, toggleAppLock } from '@/features/security/app-lock';
import { setAnalyticsEnabled } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { selectIsAiEnabled, selectProfile, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { translateCount } from '../categories/helpers';
import { ProfileAvatar } from '../profile/profile-avatar';
import { useDataCounts } from './api';
import { AppInfoTrigger } from './components/app-info-trigger';
import { DeleteDataSheet } from './components/delete-data-sheet';
import DevSection from './components/dev-section';

type Row = {
  key: string;
  icon: UniwindLucideIcon;
  title: string;
  meta?: string | null;
  danger?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
};

export function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useAppStore(selectProfile);
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const dateFormat = useAppStore.use.dateFormat();
  const theme = useAppStore.use.theme();
  const notifications = useAppStore.use.notifications();
  const lockEnabled = useAppStore.use.lockEnabled();
  const lockTimeoutMinutes = useAppStore.use.lockTimeoutMinutes();
  const analyticsEnabled = useAppStore((s) => s.analyticsEnabled ?? true);
  const aiEnabled = useAppStore(selectIsAiEnabled);
  const aiProvider = useAppStore.use.aiProvider();
  const lastBackupAt = useAppStore((s) => s.autoBackup.lastAutoBackupAt);
  const { data: counts } = useDataCounts();
  const { data: canNotify } = useQuery(notificationsQuery);
  const { selected: language, setLanguage } = useSelectedLanguage();
  const deleteModal = useModalSheet();
  const languageModal = useModalSheet();
  const legalModal = useModalSheet();

  const onSelectLanguage = (option: OptionType) => {
    setLanguage(option.value as Language);
    languageModal.close();
  };
  const legalOptions = [
    { label: translate('settings.privacy'), value: '/settings/privacy' },
    { label: translate('settings.terms'), value: '/settings/terms' },
  ];
  const onSelectLegal = (option: OptionType) => {
    legalModal.close();
    router.push(option.value as '/settings/privacy' | '/settings/terms');
  };

  const lastBackup = lastBackupAt ? formatInstant(Math.floor(Date.parse(lastBackupAt) / 1000), dateFormat) : null;
  const lockTimeout = LOCK_TIMEOUT_OPTIONS.find((o) => o.value === lockTimeoutMinutes)?.label;

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: translate('settings.money'),
      rows: [
        { key: 'accounts', icon: Banknote, title: translate('settings.accounts'), meta: counts && translateCount('settings.open_count', counts.openAccounts), onPress: () => router.push('/accounts') },
        { key: 'categories', icon: LayoutGrid, title: translate('settings.categories'), meta: counts && String(counts.categories), onPress: () => router.push('/categories') },
        { key: 'recurring', icon: RefreshCcw, title: translate('settings.scheduled'), meta: counts && translate('settings.active_count', { count: counts.activeRules }), onPress: () => router.push('/scheduled') },
      ],
    },
    {
      title: translate('settings.preferences'),
      rows: [
        { key: 'general', icon: Settings, title: translate('settings.general'), onPress: () => router.push('/settings/general') },
        { key: 'appearance', icon: Paintbrush, title: translate('settings.appearance'), meta: translate(`settings.theme.${theme}`), onPress: () => router.push('/settings/appearance') },
        { key: 'formatting', icon: ALargeSmall, title: translate('settings.formatting'), meta: formatCurrency(123456, currency, { numberFormat, currencyFormat }), onPress: () => router.push('/settings/formatting') },
        { key: 'notifications', icon: Bell, title: translate('settings.notifications'), meta: translate(notifications.global && canNotify ? 'common.on' : 'common.off'), onPress: () => router.push('/settings/notifications') },
        { key: 'language', icon: Globe, title: translate('settings.language'), meta: language?.name, onPress: languageModal.present },
      ],
    },
    {
      title: translate('settings.privacy_data'),
      rows: [
        {
          key: 'lock',
          icon: Lock,
          title: translate('settings.app_lock'),
          trailing: <Switch accessibilityLabel={translate('settings.app_lock')} checked={lockEnabled} onChange={(on) => { void toggleAppLock(on); }} />,
        },
        ...(lockEnabled ? [{ key: 'lock-after', icon: Timer, title: translate('security.lock_after'), meta: lockTimeout, onPress: () => router.push('/settings/security') }] : []),
        {
          key: 'analytics',
          icon: Shield,
          title: translate('settings.usage_stats'),
          meta: translate('settings.usage_stats_meta'),
          trailing: <Switch accessibilityLabel={translate('settings.usage_stats')} checked={analyticsEnabled} onChange={setAnalyticsEnabled} />,
        },
        { key: 'import', icon: Import, title: translate('settings.import'), meta: lastBackup && translate('settings.last_backup', { date: lastBackup }), onPress: () => router.push('/settings/import-export') },
        { key: 'delete', icon: DatabaseZap, title: translate('settings.delete_data'), danger: true, onPress: deleteModal.present },
      ],
    },
    {
      title: translate('settings.ai_section'),
      rows: [
        { key: 'ai', icon: Bot, title: translate('settings.spendwise_ai'), meta: aiEnabled ? translate(`settings.provider_${aiProvider}`) : translate('common.off'), onPress: () => router.push('/settings/ai') },
      ],
    },
    {
      title: translate('settings.about'),
      rows: [
        { key: 'legal', icon: FileText, title: translate('settings.privacy_terms'), onPress: legalModal.present },
        { key: 'bug', icon: Bug, title: translate('settings.bug_report'), onPress: () => Linking.openURL(config.links.bugs) },
        { key: 'feature', icon: Lightbulb, title: translate('settings.feature_suggestions'), onPress: () => Linking.openURL(config.links.featureSuggestions) },
        { key: 'support', icon: Heart, title: translate('settings.support'), onPress: () => Linking.openURL(config.links.support) },
      ],
    },
  ];

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" style={defaultStyles.transparentBg} contentContainerStyle={{ paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 16 }}>
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
        <View className="px-5 pt-2">
          <PageHeader
            title={translate('common.settings')}
            left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router, '/')} />}
          />
          <Card className="mt-5 flex-row items-center gap-3.5 p-[18px]">
            <ProfileAvatar size={56} />
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-semibold" numberOfLines={1}>{profile.name}</Text>
              <Text className="text-meta text-muted-foreground" numberOfLines={2}>
                {translate('settings.profile_meta', { currency, language: language?.name ?? '' })}
              </Text>
            </View>
            <GhostButton accessibilityLabel={translate('settings.edit_profile')} label={translate('common.edit')} onPress={() => router.push('/settings/profile')} />
          </Card>

          {groups.map((group) => (
            <View key={group.title}>
              <SectionHeader title={group.title} />
              <Card className="px-[18px]">
                {group.rows.map((row, index) => (
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
          ))}

          <DevSection />
          <View className="items-center pt-6">
            <AppInfoTrigger />
          </View>
        </View>
      </ScrollView>
      <Options ref={languageModal.ref} options={LANGUAGES_OPTIONS} onSelect={onSelectLanguage} value={language?.value} />
      <Options ref={legalModal.ref} options={legalOptions} onSelect={onSelectLegal} />
      <DeleteDataSheet ref={deleteModal.ref} />
    </>
  );
}

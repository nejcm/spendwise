import type { NotificationType } from './helpers';
import type { NotificationSettings } from './types';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';
import { AppState, Linking, Pressable } from 'react-native';
import { Card, SegmentedControl, Text, View } from '@/components/ui';
import { Bell } from '@/components/ui/icon';
import { formatCurrency } from '@/features/formatting/helpers';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { ToggleRow } from '@/features/settings/components/toggle-row';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { updateNotifications, useAppStore } from '@/lib/store/store';
import { isNotificationOn, toggleNotification } from './helpers';
import { notificationsQuery, setupNotifications } from './notifications';

const BILL_DAYS = ['1', '3', '7'] as const;

export function NotificationSettingsScreen() {
  const { data: canNotify, refetch } = useQuery(notificationsQuery);
  const settings = useAppStore.use.notifications();
  const recommendationsEnabled = useAppStore.use.recommendationsEnabled();
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  const onToggle = async (type: NotificationType, on: boolean) => {
    updateNotifications(toggleNotification(settings, type, on));
    if (on && !canNotify) {
      try {
        await setupNotifications();
      }
      catch {}
      void refetch();
    }
  };

  const threshold = formatCurrency(settings.lowBalanceThresholdCents ?? 5000, currency, { numberFormat, currencyFormat });
  const rows: { type: NotificationType; title: string; description: string; extra?: React.ReactNode }[] = [
    {
      type: 'upcomingBills',
      title: translate('notifications.upcoming_bills_label'),
      description: translate('notifications.upcoming_bills_description'),
      extra: isNotificationOn(settings, 'upcomingBills') && (
        <SegmentedControl
          className="mb-3.5"
          accessibilityLabel={translate('notifications.upcoming_bills_days')}
          options={BILL_DAYS.map((days) => ({ value: days, label: translate(`notifications.upcoming_bills_days_${days}`) }))}
          value={String(settings.upcomingBillsDays ?? 7) as typeof BILL_DAYS[number]}
          onChange={(days) => updateNotifications({ upcomingBillsDays: Number(days) as NonNullable<NotificationSettings['upcomingBillsDays']> })}
        />
      ),
    },
    { type: 'budgetAlerts', title: translate('notifications.budget_alerts'), description: translate('notifications.budget_alerts_description') },
    { type: 'lowBalance', title: translate('notifications.low_balance'), description: translate('notifications.low_balance_description', { amount: threshold }) },
    { type: 'weeklyDigest', title: translate('notifications.weekly_digest'), description: translate('notifications.weekly_digest_description') },
    ...(recommendationsEnabled
      ? [{ type: 'recommendations' as const, title: translate('notifications.recommendations'), description: translate('notifications.recommendations_description') }]
      : []),
  ];

  return (
    <SettingsPage title={translate('settings.notifications')}>
      <Card className="mt-5 flex-row gap-3 px-4 py-3.5">
        <View className="size-9.5 items-center justify-center rounded-[10px] bg-primary">
          <Bell size={20} colorClassName="accent-primary-foreground" />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row justify-between gap-2">
            <Text className="text-meta font-semibold text-foreground">{translate('notifications.upcoming_bills')}</Text>
            <Text className="text-meta text-muted-foreground">{translate('notifications.preview_time')}</Text>
          </View>
          <Text className="text-sm">{translate('notifications.bill_due_today', { name: translate('notifications.preview_bill_name') })}</Text>
        </View>
      </Card>
      <Text className="px-1 pt-2 text-meta text-muted-foreground">{translate('notifications.preview_caption')}</Text>

      {settings.global && canNotify === false && (
        <Card className="mt-4 min-h-13.5 flex-row items-center justify-between gap-3 px-4">
          <Text className="min-w-0 flex-1 text-row">{translate('notifications.system_off')}</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => { void Linking.openSettings(); }}>
            <Text className="text-row font-semibold text-accent">{translate('notifications.open_settings')}</Text>
          </Pressable>
        </Card>
      )}

      <Card className="mt-4 px-4">
        {rows.map(({ type, extra, ...row }, index) => (
          <View key={type} className={cn(index > 0 && 'border-t border-border')}>
            <ToggleRow {...row} checked={isNotificationOn(settings, type)} onChange={(on) => { void onToggle(type, on); }} />
            {extra}
          </View>
        ))}
      </Card>
      <Text className="px-1 pt-2 text-meta text-muted-foreground">{translate('notifications.delivery_note')}</Text>
    </SettingsPage>
  );
}

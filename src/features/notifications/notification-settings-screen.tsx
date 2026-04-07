import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { Platform } from 'react-native';
import DetailsSection from '@/components/details';
import { Alert, FocusAwareStatusBar, ScrollView, Select, Switch } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { updateNotifications, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { notificationsQuery, setupNotifications } from './notifications';

const BILL_DAY_OPTIONS = [
  { label: translate('notifications.upcoming_bills_days_1'), value: 1 },
  { label: translate('notifications.upcoming_bills_days_3'), value: 3 },
  { label: translate('notifications.upcoming_bills_days_7'), value: 7 },
] as const;

export function NotificationSettingsScreen() {
  const { data: canNotify } = useQuery(notificationsQuery);
  const settings = useAppStore.use.notifications();
  const globalEnabled = !!canNotify && !!settings.global;

  const handleEnable = async (on: boolean) => {
    if (on) {
      try {
        await setupNotifications();
        Alert.alert(
          translate('settings.notifications'),
          Platform.OS === 'ios'
            ? translate('notifications.ios_opened')
            : translate('notifications.android_requested'),
        );
      }
      catch {
        Alert.alert(translate('settings.notifications'), translate('notifications.update_error'));
      }
    }
    updateNotifications({ global: on });
  };

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4" style={defaultStyles.transparentBg}>
        <DetailsSection
          className="mb-4"
          data={[{
            label: translate('notifications.label'),
            description: translate('notifications.enable_description'),
            value: (
              <Switch
                accessibilityLabel={translate('notifications.label')}
                checked={globalEnabled}
                onChange={(checked) => { void handleEnable(checked); }}
              />
            ),
          }]}
        />

        {globalEnabled && (
          <>
            <DetailsSection
              className="mb-4"
              data={[{
                label: translate('notifications.budget_alerts'),
                description: translate('notifications.budget_alerts_description'),
                value: (
                  <Switch
                    accessibilityLabel={translate('notifications.budget_alerts')}
                    checked={settings.budgetAlerts !== false}
                    onChange={(checked) => updateNotifications({ budgetAlerts: checked })}
                  />
                ),
              }]}
            />

            <DetailsSection
              className="mb-4"
              data={[
                {
                  label: translate('notifications.upcoming_bills_label'),
                  description: translate('notifications.upcoming_bills_description'),
                  value: (
                    <Switch
                      accessibilityLabel={translate('notifications.upcoming_bills_label')}
                      checked={settings.upcomingBills !== false}
                      onChange={(checked) => updateNotifications({ upcomingBills: checked })}
                    />
                  ),
                },
                {
                  label: translate('notifications.upcoming_bills_days'),
                  value: (
                    <Select
                      size="sm"
                      value={settings.upcomingBillsDays ?? 7}
                      options={BILL_DAY_OPTIONS as unknown as { label: string; value: number }[]}
                      onSelect={(value) => updateNotifications({ upcomingBillsDays: value as 1 | 3 | 7 })}
                      disabled={settings.upcomingBills === false}
                    />
                  ),
                },
              ]}
            />

            <DetailsSection
              className="mb-4"
              data={[{
                label: translate('notifications.low_balance'),
                description: translate('notifications.low_balance_description'),
                value: (
                  <Switch
                    accessibilityLabel={translate('notifications.low_balance')}
                    checked={settings.lowBalance === true}
                    onChange={(checked) => updateNotifications({ lowBalance: checked })}
                  />
                ),
              }]}
            />

            <DetailsSection
              className="mb-4"
              data={[{
                label: translate('notifications.weekly_digest'),
                description: translate('notifications.weekly_digest_description'),
                value: (
                  <Switch
                    accessibilityLabel={translate('notifications.weekly_digest')}
                    checked={settings.weeklyDigest === true}
                    onChange={(checked) => updateNotifications({ weeklyDigest: checked })}
                  />
                ),
              }]}
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

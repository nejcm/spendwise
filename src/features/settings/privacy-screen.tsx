import * as React from 'react';
import { Card, SectionHeader, Text, View } from '@/components/ui';
import { setAnalyticsEnabled } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { SettingsPage } from './components/settings-page';
import { ToggleRow } from './components/toggle-row';

const CONTACT_EMAIL = 'nmursi2@gmail.com';
const OUTBOUND = ['ai', 'stats', 'rates', 'files', 'stores'] as const;
const NOTES = ['children', 'changes'] as const;

export function PrivacyScreen() {
  const analyticsEnabled = useAppStore((s) => s.analyticsEnabled ?? true);

  return (
    <SettingsPage title={translate('settings.privacy')}>
      <View className="mt-5 gap-1.5 rounded-card border border-accent-line bg-accent-soft p-[18px]">
        <Text className="text-lg font-semibold">{translate('privacy.hero_title')}</Text>
        <Text className="text-sm/snug text-muted-foreground">{translate('privacy.hero_body')}</Text>
      </View>

      <SectionHeader title={translate('privacy.outbound_title')} />
      <Card className="px-4">
        {OUTBOUND.map((item, index) => (
          <View key={item} className={cn('gap-1 py-3.5', index > 0 && 'border-t border-border')}>
            <Text className="text-row font-medium">{translate(`privacy.${item}_title`)}</Text>
            <Text className="text-meta text-muted-foreground">{translate(`privacy.${item}_body`)}</Text>
          </View>
        ))}
      </Card>

      <SectionHeader title={translate('privacy.choices_title')} />
      <Card className="px-4">
        <ToggleRow
          title={translate('settings.usage_stats')}
          description={translate('settings.usage_stats_meta')}
          checked={analyticsEnabled}
          onChange={setAnalyticsEnabled}
        />
      </Card>
      <Text className="px-1 pt-2.5 text-meta text-muted-foreground">{translate('privacy.choices_body')}</Text>

      {NOTES.map((item) => (
        <View key={item}>
          <SectionHeader title={translate(`privacy.${item}_title`)} />
          <Text className="px-1 text-sm/snug text-muted-foreground">{translate(`privacy.${item}_body`)}</Text>
        </View>
      ))}
      <SectionHeader title={translate('privacy.contact_title')} />
      <Text selectable className="px-1 text-sm/snug text-muted-foreground">{translate('privacy.contact_body', { email: CONTACT_EMAIL })}</Text>
      <Text className="px-1 pt-6 text-xs text-muted-foreground">{translate('privacy.effective')}</Text>
    </SettingsPage>
  );
}

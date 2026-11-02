import type { UniwindLucideIcon } from '@/components/ui/icon';
import * as React from 'react';

import { SolidButton, Text, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { Banknote, Calendar, PieChart, Shield, Sparkles } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import OnboardingLayout from '../layout';

const FEATURES: { key: 'accounts' | 'budgets' | 'bills' | 'ai' | 'privacy'; Icon: UniwindLucideIcon }[] = [
  { key: 'accounts', Icon: Banknote },
  { key: 'budgets', Icon: PieChart },
  { key: 'bills', Icon: Calendar },
  { key: 'ai', Icon: Sparkles },
  { key: 'privacy', Icon: Shield },
];

export type ReadyStepProps = {
  onBack: () => void;
  onFinish: () => void;
  onImportCsv: () => void;
};

export default function ReadyStep({ onBack, onFinish, onImportCsv }: ReadyStepProps) {
  const name = useAppStore((state) => state.profile.name.trim());

  return (
    <OnboardingLayout
      step={4}
      title={name ? translate('onboarding.ready_title', { name }) : translate('onboarding.ready_title_anonymous')}
      subtitle={translate('onboarding.ready_subtitle')}
      onBack={onBack}
      footer={(
        <>
          <SolidButton color="primary" size="lg" fullWidth label={translate('onboarding.start_tracking')} onPress={onFinish} />
          <GhostButton color="secondary" size="md" textClassName="text-foreground-2" label={translate('onboarding.import_csv')} onPress={onImportCsv} />
        </>
      )}
    >
      <View className="gap-4.5 pt-7">
        {FEATURES.map(({ key, Icon }) => (
          <View key={key} className="flex-row gap-3.5">
            <View className="size-11 items-center justify-center rounded-tile bg-card">
              <Icon size={20} colorClassName="accent-foreground" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold">{translate(`onboarding.features.${key}.title`)}</Text>
              <Text className="text-sm/snug text-muted-foreground">{translate(`onboarding.features.${key}.body`)}</Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingLayout>
  );
}

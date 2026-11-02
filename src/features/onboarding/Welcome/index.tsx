import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useCSSVariable, useUniwind } from 'uniwind';

import { AmountText, IconTile, Image, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { formatCurrency } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

const SPARKLINE = 'M0 52 C30 50 45 44 70 45 S110 52 140 46 S185 32 210 34 S250 42 275 36 S320 16 350 12';

export type WelcomeStepProps = {
  onNext: () => void;
  onRestore: () => void;
  restoring: boolean;
};

function Preview({ accent }: { accent: string }) {
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const under = formatCurrency(3700, currency, { numberFormat, currencyFormat, fractionDigits: 0 });
  const [beforeAmount, afterAmount] = translate('onboarding.preview.ai_message', { amount: under }).split(under);

  return (
    <View className="relative mt-7 h-[330px]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className="absolute top-0 left-0 w-[78%] overflow-hidden rounded-hero bg-card px-[18px] pt-[18px]">
        <Text className="text-meta text-muted-foreground">{translate('onboarding.preview.total_balance')}</Text>
        <AmountText value={740075} currency={currency} size="hero" />
        <View className="mx-[-18px] mt-3 h-[52px]">
          <Svg width="100%" height="100%" viewBox="0 0 350 64" preserveAspectRatio="none">
            <Path d={`${SPARKLINE} L350 64 L0 64 Z`} fill={accent} fillOpacity={0.12} />
            <Path d={SPARKLINE} fill="none" stroke={accent} strokeWidth={2.4} strokeLinejoin="round" />
          </Svg>
        </View>
      </View>
      <View className="absolute top-[150px] right-0 w-[62%] gap-2 rounded-card border border-accent-line bg-accent-soft px-4 py-3.5">
        <Text className="text-xs font-semibold">{translate('onboarding.preview.ai_title')}</Text>
        <Text className="text-sm">
          {beforeAmount}
          <Text className="text-sm font-semibold text-accent">{under}</Text>
          {afterAmount}
        </Text>
      </View>
      <View className="absolute top-[252px] left-5 flex-row items-center gap-2.5 rounded-2xl bg-card py-2.5 pr-3.5 pl-2.5">
        <IconTile icon="🛒" color="#3fb27f" size="sm" />
        <View>
          <Text className="text-sm font-medium">{translate('onboarding.preview.merchant')}</Text>
          <Text className="text-xs text-muted-foreground">{translate('onboarding.preview.merchant_meta')}</Text>
        </View>
        <AmountText value={-4820} currency={currency} className="pl-4 text-sm" />
      </View>
    </View>
  );
}

export default function WelcomeStep({ onNext, onRestore, restoring }: WelcomeStepProps) {
  const accent = String(useCSSVariable('--color-accent'));
  const { theme } = useUniwind();

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6">
        <Image
          source={theme === 'dark' ? require('../../../../assets/spendwise-white.svg') : require('../../../../assets/spendwise.svg')}
          contentFit="contain"
          accessibilityLabel={translate('onboarding.title')}
          className="h-7 w-35"
        />
        <Preview accent={accent} />
        <View className="gap-3 pt-7">
          <Text accessibilityRole="header" className="text-[34px]/[37px] font-bold tracking-page-title">{translate('onboarding.welcome_headline')}</Text>
          <Text className="text-base/normal text-foreground-2">{translate('onboarding.welcome_copy')}</Text>
        </View>
      </ScrollView>
      <View className="items-center gap-1.5 px-6 pt-4 pb-8">
        <SolidButton color="primary" size="lg" fullWidth label={translate('onboarding.get_started')} onPress={onNext} />
        <GhostButton
          color="secondary"
          size="md"
          textClassName="text-foreground-2"
          label={translate('onboarding.restore_backup')}
          loading={restoring}
          onPress={onRestore}
        />
      </View>
    </View>
  );
}

import * as React from 'react';
import { ArrowLeftIcon, IconButton, ScrollView, Text, View } from '@/components/ui';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';

const TOTAL_STEPS = 4;

export type OnboardingLayoutProps = {
  step: number;
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export default function OnboardingLayout({ step, title, subtitle, onBack, children, footer }: OnboardingLayoutProps) {
  const stepLabel = translate('onboarding.step_of', { step, total: TOTAL_STEPS });

  return (
    <View className="flex-1">
      <View className="mt-4 h-12 flex-row items-center gap-4 px-6">
        <IconButton color="secondary" size="md" onPress={onBack} accessibilityLabel={translate('common.back')}>
          <ArrowLeftIcon size={20} colorClassName="accent-foreground" />
        </IconButton>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={stepLabel}
          accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: step }}
          className="flex-1 flex-row gap-1.5"
        >
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <View key={index} className={cn('h-1 flex-1 rounded-full', index < step ? 'bg-accent' : 'bg-track')} />
          ))}
        </View>
        <Text className="w-11 text-right text-sm text-muted-foreground">{stepLabel}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-9 pb-6" keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" className="text-page-title font-bold tracking-page-title">{title}</Text>
        <Text className="pt-2 text-base text-foreground-2">{subtitle}</Text>
        {children}
      </ScrollView>

      <View className="items-center gap-1.5 px-6 pt-2 pb-8">
        {footer}
      </View>
    </View>
  );
}

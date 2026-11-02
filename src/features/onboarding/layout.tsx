import * as React from 'react';
import Animated, { FadeInLeft, FadeInRight, StretchInX } from 'react-native-reanimated';
import { ArrowLeftIcon, IconButton, ScrollView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { easeOut } from '@/lib/theme/motion';
import { OnboardingDirectionContext } from './direction-context';

const TOTAL_STEPS = 4;

// Presets, not custom Keyframes: Reanimated web can drop a custom keyframe's CSS before it starts and leave the view hidden.
const STEP_ENTERING = { 1: FadeInRight.duration(280).easing(easeOut), [-1]: FadeInLeft.duration(280).easing(easeOut) } as const;
const SEGMENT_ENTERING = StretchInX.duration(300).easing(easeOut);

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
  const direction = React.use(OnboardingDirectionContext);

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
            <View key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-track">
              {index < step && (
                <Animated.View
                  entering={index === step - 1 && direction === 1 ? SEGMENT_ENTERING : undefined}
                  style={{ height: '100%', transformOrigin: 'left' }}
                >
                  <View className="h-full rounded-full bg-accent" />
                </Animated.View>
              )}
            </View>
          ))}
        </View>
        <Text className="w-11 text-right text-sm text-muted-foreground">{stepLabel}</Text>
      </View>

      <Animated.View entering={STEP_ENTERING[direction]} style={{ flex: 1 }}>
        <ScrollView className="flex-1" contentContainerClassName="px-6 pt-9 pb-6" keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" className="text-page-title font-bold tracking-page-title">{title}</Text>
          <Text className="pt-2 text-base text-foreground-2">{subtitle}</Text>
          {children}
        </ScrollView>

        <View className="items-center gap-1.5 px-6 pt-2 pb-8">
          {footer}
        </View>
      </Animated.View>
    </View>
  );
}

import * as React from 'react';

import { Pressable, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { ChevronDown, ChevronUp } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import OnboardingLayout from '../layout';

const GUIDANCE_KEYS = [
  'ai',
  'scan',
  'backup',
  'currency',
  'privacy',
] as const;

type GuidanceKey = typeof GUIDANCE_KEYS[number];

type GuidanceStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

function GuidanceRow({
  itemKey,
  expanded,
  onToggle,
}: {
  itemKey: GuidanceKey;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Chevron = expanded ? ChevronUp : ChevronDown;

  return (
    <View className="rounded-xl bg-card">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center justify-between gap-3 px-4 py-3"
        onPress={onToggle}
      >
        <Text className="min-w-0 flex-1 font-medium text-foreground">
          {translate(`onboarding.guidance.items.${itemKey}.title`)}
        </Text>
        <Chevron size={18} className="text-muted-foreground" />
      </Pressable>
      {expanded && (
        <Text className="px-4 pb-4 text-sm/snug text-muted-foreground">
          {translate(`onboarding.guidance.items.${itemKey}.body`)}
        </Text>
      )}
    </View>
  );
}

export default function GuidanceStep({ onBack, onNext, currentStep }: GuidanceStepProps) {
  const [expandedKey, setExpandedKey] = React.useState<GuidanceKey | null>('ai');

  return (
    <OnboardingLayout
      title={translate('onboarding.guidance.title')}
      currentStep={currentStep}
      className="mt-6"
      footer={(
        <>
          <GhostButton
            label={translate('common.back')}
            size="lg"
            onPress={onBack}
          />
          <SolidButton
            color="primary"
            label={translate('onboarding.finish_setup')}
            onPress={onNext}
            className="flex-1"
            size="lg"
          />
        </>
      )}
    >
      <ScrollView
        className="max-h-[520]"
        contentContainerClassName="gap-3 pb-2"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-1 text-center text-base/snug text-muted-foreground">
          {translate('onboarding.guidance.subtitle')}
        </Text>
        {GUIDANCE_KEYS.map((itemKey) => (
          <GuidanceRow
            key={itemKey}
            itemKey={itemKey}
            expanded={expandedKey === itemKey}
            onToggle={() => {
              setExpandedKey((current) => current === itemKey ? null : itemKey);
            }}
          />
        ))}
      </ScrollView>
    </OnboardingLayout>
  );
}

import type { UniwindLucideIcon } from '@/components/ui/icon';

import { ScrollView, SolidButton, Text, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { Banknote, Bell, BotMessageSquare, DatabaseBackupIcon, PieChart } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import OnboardingLayout from '../layout';

const HIGHLIGHT_ITEMS = [
  { key: 'accounts', Icon: Banknote },
  { key: 'insights', Icon: PieChart },
  { key: 'recurring', Icon: Bell },
  { key: 'ai', Icon: BotMessageSquare },
  { key: 'data', Icon: DatabaseBackupIcon },
] as const;

type HighlightKey = typeof HIGHLIGHT_ITEMS[number]['key'];

type HighlightsStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

function HighlightCard({ itemKey, Icon }: { itemKey: HighlightKey; Icon: UniwindLucideIcon }) {
  return (
    <View className="flex-row gap-3 rounded-lg bg-card p-3">
      <View className="size-10 items-center justify-center rounded-lg bg-muted">
        <Icon size={24} className="text-primary" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-semibold text-foreground">
          {translate(`onboarding.highlights.items.${itemKey}.title`)}
        </Text>
        <Text className="mt-1 text-sm/snug text-muted-foreground">
          {translate(`onboarding.highlights.items.${itemKey}.body`)}
        </Text>
      </View>
    </View>
  );
}

export default function HighlightsStep({ onBack, onNext, currentStep }: HighlightsStepProps) {
  return (
    <OnboardingLayout
      title={translate('onboarding.highlights.title')}
      currentStep={currentStep}
      className="flex-1 py-0"
      footer={(
        <>
          <GhostButton
            label={translate('common.back')}
            size="lg"
            onPress={onBack}
          />
          <SolidButton
            color="primary"
            label={translate('onboarding.start_tracking')}
            onPress={onNext}
            className="flex-1"
            size="lg"
          />
        </>
      )}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 pb-2"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-1 text-center text-base/snug text-muted-foreground">
          {translate('onboarding.highlights.subtitle')}
        </Text>
        {HIGHLIGHT_ITEMS.map(({ key, Icon }) => (
          <HighlightCard key={key} itemKey={key} Icon={Icon} />
        ))}
      </ScrollView>
    </OnboardingLayout>
  );
}

import * as React from 'react';

import { Button, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import IntroNav from '../Nav';

export type SettingsStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export default function SettingsStep({ onBack, onNext }: SettingsStepProps) {
  return (
    <>
      <View className="flex-1">
        <View className="bg-subtle p-6">
          <View className="flex-row items-center justify-center gap-3">
            <Text className="text-2xl font-bold tracking-tight text-black dark:text-black">{translate('onboarding.title')}</Text>
          </View>
        </View>
        <View className="px-6 pt-8">
          <IntroNav current={2} />

        </View>
        <View className="mt-auto w-full flex-row items-center gap-2 px-6 pb-8">
          <Button
            label={translate('common.back')}
            variant="ghost"
            size="lg"
            fullWidth={false}
            onPress={onBack}
            accessibilityLabel={translate('common.back')}
          />
          <Button
            label={translate('onboarding.finish_setup')}
            onPress={onNext}
            className="flex-1"
            size="lg"
          />
        </View>
      </View>
    </>
  );
}

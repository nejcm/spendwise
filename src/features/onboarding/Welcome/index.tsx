import * as React from 'react';

import { Image, SolidButton, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import IntroNav from '../Nav';

export type WelcomeStepProps = {
  onNext: () => void;
  currentStep: number;
};

export default function WelcomeStep({ onNext, currentStep }: WelcomeStepProps) {
  return (
    <>
      <View className="flex-1 bg-gray-200 px-6 pt-12 pb-16 dark:bg-gray-50">
        <View className="mb-8 flex-row items-center justify-center gap-3 xs:mb-10">
          <Text className="text-3xl font-bold tracking-tight text-gray-900">{translate('onboarding.title')}</Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <Image
            source={require('../../../../assets/intro.svg')}
            contentFit="contain"
            className="size-full max-w-[360]"
          />
        </View>
      </View>

      <View className="shrink-0 justify-between bg-background px-6 py-8">
        <View>
          <IntroNav current={currentStep} />
          <Text className="mb-4 text-center text-2xl font-bold text-black xs:text-[1.75rem] dark:text-white">
            {translate('onboarding.welcome_headline')}
          </Text>
          <Text className="text-center text-base/snug text-gray-500 xs:text-lg/snug dark:text-gray-400">
            {translate('onboarding.welcome_copy')}
          </Text>
        </View>

        <SolidButton
          color="primary"
          label={translate('onboarding.get_started')}
          onPress={onNext}
          className="mt-8"
          fullWidth={true}
          size="lg"
        />
      </View>
    </>
  );
}

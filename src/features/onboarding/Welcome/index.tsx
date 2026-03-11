import * as React from 'react';

import { Button, Image, SafeAreaView, Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import IntroNav from '../Nav';

export default function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-[1.15] bg-subtle px-6 pt-8 pb-12">
        <View className="mb-10 flex-row items-center justify-center gap-3">
          <Text className="text-3xl font-bold tracking-tight text-black dark:text-black">{translate('onboarding.title')}</Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <Image
            source={require('../../../../assets/intro.svg')}
            contentFit="contain"
            className="size-full max-w-[360px]"
          />
        </View>
      </View>

      <View className="flex-1 justify-between px-6 py-8 dark:bg-neutral-950">
        <View>
          <IntroNav current={0} />

          <Text className="mb-4 text-center text-[1.75rem] font-bold text-black dark:text-white">
            {translate('onboarding.welcome_headline')}
          </Text>
          <Text className="text-center text-lg/snug text-neutral-500 dark:text-neutral-400">
            {translate('onboarding.welcome_copy')}
          </Text>
        </View>

        <Button
          label={translate('onboarding.get_started')}
          onPress={onNext}
          className="mt-8"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

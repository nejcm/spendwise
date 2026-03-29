import type { OptionType } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import type { Language } from '@/features/languages/types';
import * as React from 'react';
import { Image, Options, SolidButton, Text, useModal, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { CURRENCIES_MAP, CURRENCY_OPTIONS } from '@/features/currencies';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { LANGUAGES_OPTIONS } from '@/features/languages';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { setCurrency, useAppStore } from '@/lib/store';
import OnboardingLayout from '../layout';

export type SettingsStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

export default function SettingsStep({ onBack, onNext, currentStep }: SettingsStepProps) {
  const { selected, setLanguage } = useSelectedLanguage();
  const currency = useAppStore.use.currency();
  const selectedCurrency = CURRENCIES_MAP[currency];

  const modal = useModal();
  const currencyModal = useModal();
  const onSelect = React.useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal],
  );
  const onSelectCurrency = React.useCallback(
    (option: OptionType) => {
      setCurrency(option.value as CurrencyKey);
      currencyModal.dismiss();
    },
    [currencyModal],
  );

  return (
    <>
      <OnboardingLayout
        currentStep={currentStep}
        title={translate('onboarding.settings')}
        className="my-auto"
        footer={(
          <>
            <GhostButton
              label={translate('common.back')}
              size="lg"
              onPress={onBack}
            />
            <SolidButton
              label={translate('common.next')}
              onPress={onNext}
              className="flex-1"
              size="lg"
            />
          </>
        )}
      >
        <View className="flex-col gap-10">
          <View className="flex-col items-center gap-1">
            <Text className="text-center text-lg text-muted-foreground">
              {translate('onboarding.select_language')}
            </Text>
            <GhostButton size="xl" className="items-center gap-4" onPress={modal.present}>
              <Image source={selected.image} className="size-10 rounded-full" />
              <Text className="text-4xl text-foreground">{selected.name}</Text>
            </GhostButton>
            <Options ref={modal.ref} options={LANGUAGES_OPTIONS} onSelect={onSelect} value={selected?.value} />
          </View>
          <View className="flex-col items-center gap-1">
            <Text className="text-center text-lg text-muted-foreground">
              {translate('settings.default_currency')}
            </Text>
            <GhostButton size="xl" className="items-center gap-4" onPress={currencyModal.present}>
              <Image source={CURRENCY_IMAGES[selectedCurrency.value]} className="size-10 rounded-full" />
              <Text className="text-4xl text-foreground">{selectedCurrency.value}</Text>
            </GhostButton>
            <Options
              ref={currencyModal.ref}
              options={CURRENCY_OPTIONS}
              onSelect={onSelectCurrency}
              value={selectedCurrency.value}
            />
          </View>
        </View>
      </OnboardingLayout>
    </>
  );
}

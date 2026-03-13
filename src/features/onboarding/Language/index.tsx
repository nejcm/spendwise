import type { Language } from '../../languages/types';
import type { OptionType } from '@/components/ui';
import * as React from 'react';
import { Button, Image, Options, Text, useModal } from '@/components/ui';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { LANGUAGES_OPTIONS } from '../../languages';
import OnboardingLayout from '../layout';

export type LanguageStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

export default function LanguageStep({ onBack, onNext, currentStep }: LanguageStepProps) {
  const { selected, setLanguage } = useSelectedLanguage();

  const modal = useModal();
  const onSelect = React.useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal],
  );

  return (
    <>
      <OnboardingLayout
        currentStep={currentStep}
        title={translate('onboarding.settings')}
        className="my-auto"
        footer={(
          <>
            <Button
              label={translate('common.back')}
              variant="ghost"
              size="lg"
              fullWidth={false}
              onPress={onBack}
              accessibilityLabel={translate('common.back')}
            />
            <Button
              label={translate('common.next')}
              onPress={onNext}
              className="flex-1"
              size="lg"
            />
          </>
        )}
      >
        <Text className="mb-4 text-center text-lg text-gray-400">
          {translate('onboarding.select_language')}
        </Text>
        <Button variant="ghost" size="xl" className="items-center gap-4 text-4xl" onPress={modal.present}>
          <Image source={selected.image} className="size-10 rounded-full" />
          {selected.name}
        </Button>
        <Options ref={modal.ref} options={LANGUAGES_OPTIONS} onSelect={onSelect} value={selected?.value} />
      </OnboardingLayout>
    </>
  );
}

import type { ThemeType } from '../../settings/theme';

import type { OptionType } from '@/components/ui';
import * as React from 'react';
import { Button, Options, Text, useModal } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useSelectedTheme } from '@/lib/theme/use-selected-theme';
import { THEMES_OPTIONS } from '../../settings/theme';
import OnboardingLayout from '../layout';

export type SettingsStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

export default function SettingsStep({ onBack, onNext, currentStep }: SettingsStepProps) {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const modal = useModal();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setSelectedTheme(option.value as ThemeType);
      modal.dismiss();
    },
    [setSelectedTheme, modal],
  );

  const theme = React.useMemo(() => THEMES_OPTIONS.find((t) => t.value === selectedTheme), [selectedTheme]);

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
              label={translate('onboarding.finish_setup')}
              onPress={onNext}
              className="flex-1"
              size="lg"
            />
          </>
        )}
      >
        <Text className="mb-4 text-center text-lg text-gray-400">
          {translate('onboarding.select_theme')}
        </Text>
        <Button variant="ghost" size="xl" className="text-4xl" onPress={modal.present}>
          {theme?.label}
        </Button>
        <Options ref={modal.ref} options={THEMES_OPTIONS} onSelect={onSelect} value={theme?.value} />
      </OnboardingLayout>
    </>
  );
}

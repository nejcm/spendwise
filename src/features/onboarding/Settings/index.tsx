import * as React from 'react';

import { Button } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { ThemeItem } from '../../settings/components/theme-item';
import OnboardingLayout from '../layout';

export type SettingsStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

export default function SettingsStep({ onBack, onNext, currentStep }: SettingsStepProps) {
  return (
    <>
      <OnboardingLayout
        currentStep={currentStep}
        title={translate('onboarding.settings')}
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
        <ThemeItem />
      </OnboardingLayout>
    </>
  );
}

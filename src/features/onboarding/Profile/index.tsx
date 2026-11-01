import * as React from 'react';

import { Input, SolidButton } from '@/components/ui';
import { AvatarPicker } from '@/features/profile/profile-avatar';
import { translate } from '@/lib/i18n';
import { updateProfile, useAppStore } from '@/lib/store/store';
import OnboardingLayout from '../layout';

export type ProfileStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export default function ProfileStep({ onBack, onNext }: ProfileStepProps) {
  const name = useAppStore((state) => state.profile.name);

  return (
    <OnboardingLayout
      step={1}
      title={translate('onboarding.profile_title')}
      subtitle={translate('onboarding.profile_subtitle')}
      onBack={onBack}
      footer={<SolidButton color="primary" size="lg" fullWidth label={translate('onboarding.continue')} onPress={onNext} />}
    >
      <AvatarPicker className="pt-10" />
      <Input
        label={translate('onboarding.name_label')}
        value={name}
        onChangeText={(text) => updateProfile({ name: text })}
        placeholder={translate('onboarding.enter_name')}
        autoComplete="given-name"
        size="lg"
        containerClassName="pt-8"
      />
    </OnboardingLayout>
  );
}

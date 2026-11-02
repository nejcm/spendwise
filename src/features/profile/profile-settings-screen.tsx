import * as React from 'react';
import { Input } from '@/components/ui';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { translate } from '@/lib/i18n';
import { updateProfile, useAppStore } from '@/lib/store/store';
import { AvatarPicker } from './profile-avatar';

export function ProfileSettingsScreen() {
  const name = useAppStore((state) => state.profile.name);

  return (
    <SettingsPage title={translate('settings.profile')}>
      <AvatarPicker className="pt-6" />
      <Input
        label={translate('onboarding.name_label')}
        value={name}
        onChangeText={(text) => updateProfile({ name: text })}
        placeholder={translate('onboarding.enter_name')}
        autoComplete="given-name"
        size="lg"
        containerClassName="pt-8"
      />
    </SettingsPage>
  );
}

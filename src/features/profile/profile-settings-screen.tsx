import * as React from 'react';

import { FocusAwareStatusBar, Input, ScrollView } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { updateProfile, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';

import { AvatarPicker } from './profile-avatar';

export function ProfileSettingsScreen() {
  const name = useAppStore((state) => state.profile.name);

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="gap-8 p-12" style={defaultStyles.transparentBg}>
        <AvatarPicker />
        <Input
          value={name}
          onChangeText={(text) => updateProfile({ name: text })}
          placeholder={translate('onboarding.enter_name')}
          style={{ textAlign: 'center' }}
          size="xl"
        />
      </ScrollView>
    </>
  );
}

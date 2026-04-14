import * as React from 'react';

import { Image, Input, ModalSheet, Pressable, ScrollView, SolidButton, Text, useModalSheet, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { translate } from '@/lib/i18n';
import { updateProfile, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { AVATARS_LIST, getAvatar } from '../../profile';
import OnboardingLayout from '../layout';

export type ProfileStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

export default function ProfileStep({ onBack, onNext, currentStep }: ProfileStepProps) {
  const { name, avatar } = useAppStore((state) => state.profile);
  const avatarModal = useModalSheet();

  return (
    <>
      <OnboardingLayout
        title={translate('onboarding.create_profile')}
        currentStep={currentStep}
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
        <>
          <Pressable
            className="mb-10 items-center justify-center"
            onPress={() => avatarModal.present()}
            accessibilityLabel="Open avatar picker"
            accessibilityRole="button"
          >
            <Image
              source={getAvatar(avatar)}
              className="size-28 rounded-full"
            />
            <Text className="mt-2 text-xs text-gray-400 dark:text-gray-400">{translate('onboarding.tap_to_change')}</Text>
          </Pressable>
          <Input
            value={name}
            onChangeText={(text) => updateProfile({ name: text })}
            placeholder={translate('onboarding.enter_name')}
            style={{ textAlign: 'center' }}
            size="xl"
          />
        </>
      </OnboardingLayout>
      <ModalSheet
        ref={avatarModal.ref}
        title={translate('onboarding.choose_avatar')}
      >
        <ScrollView
          style={defaultStyles.transparentBg}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        >
          <View className="flex-row flex-wrap justify-center gap-3">
            {AVATARS_LIST.map((imageSource, index) => {
              const id = index + 1;
              const isSelected = id === avatar;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    updateProfile({ avatar: id });
                    avatarModal.dismiss();
                  }}
                  className={`rounded-full p-1 ${isSelected ? 'border-2 border-gray-900 dark:border-white' : 'border border-transparent'}`}
                  accessibilityLabel="Choose avatar"
                  accessibilityRole="button"
                >
                  <Image
                    source={imageSource}
                    className="size-16 rounded-full"
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ModalSheet>
    </>
  );
}

import * as React from 'react';

import { Button, Image, Input, Modal, Pressable, ScrollView, Text, useModal, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { updateProfile, useAppStore } from '@/lib/store';
import { AVATARS } from '../../profile';
import OnboardingLayout from '../layout';

export type SetupStepProps = {
  onBack: () => void;
  onNext: () => void;
  currentStep: number;
};

const avatars = Object.values(AVATARS);

export default function SetupStep({ onBack, onNext, currentStep }: SetupStepProps) {
  const { name, avatar } = useAppStore((state) => state.profile);
  const avatarModal = useModal();

  return (
    <>
      <OnboardingLayout
        title={translate('onboarding.create_profile')}
        currentStep={currentStep}
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
        <>
          <Pressable
            className="mb-10 items-center justify-center"
            onPress={() => avatarModal.present()}
            accessibilityLabel="Open avatar picker"
            accessibilityRole="button"
          >
            <Image
              source={avatars[avatar - 1]}
              className="size-28 rounded-full"
            />
            <Text className="mt-2 text-xs text-neutral-400 dark:text-neutral-400">Tap to change</Text>
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
      <Modal
        ref={avatarModal.ref}
        title={translate('onboarding.choose_avatar')}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
          <View className="flex-row flex-wrap justify-center gap-3">
            {avatars.map((imageSource, index) => {
              const id = index + 1;
              const isSelected = id === avatar;

              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    updateProfile({ avatar: id });
                    avatarModal.dismiss();
                  }}
                  className={`rounded-full p-1 ${isSelected ? 'border-2 border-neutral-900 dark:border-white' : 'border border-transparent'}`}
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
      </Modal>
    </>
  );
}

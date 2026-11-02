import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Image, ModalSheet, Pressable, Text, useModalSheet, User, View } from '@/components/ui';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { updateProfile, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { AVATAR_COLORS, AVATARS_LIST, getAvatar } from '.';

export function ProfileAvatar({ size, className }: { size: number; className?: string }) {
  const { name, avatar, avatarColor } = useAppStore.use.profile();
  const dimensions = { width: size, height: size };

  if (avatar > 0) {
    return (
      <View className={className} style={dimensions}>
        <Image source={getAvatar(avatar)} className="size-full rounded-full" />
      </View>
    );
  }

  const initial = Array.from(name.trim())[0]?.toUpperCase();
  return (
    <View
      className={cn('items-center justify-center rounded-full', className)}
      style={{ ...dimensions, backgroundColor: avatarColor ?? AVATAR_COLORS[0] }}
    >
      {initial
        ? <Text className="font-bold text-gray-900" style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}>{initial}</Text>
        : <User size={size * 0.45} colorClassName="accent-gray-900" />}
    </View>
  );
}

export function AvatarPicker({ className }: { className?: string }) {
  const { avatar, avatarColor } = useAppStore.use.profile();
  const modal = useModalSheet();
  const color = avatarColor ?? AVATAR_COLORS[0];

  return (
    <View className={cn('items-center gap-4.5', className)}>
      <ProfileAvatar size={112} />
      <View accessibilityRole="radiogroup" accessibilityLabel={translate('onboarding.avatar_color')} className="flex-row gap-3">
        {AVATAR_COLORS.map((hex, index) => {
          const selected = avatar === 0 && hex === color;
          return (
            <Pressable
              key={hex}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={translate('onboarding.avatar_color_n', { index: index + 1 })}
              onPress={() => updateProfile({ avatar: 0, avatarColor: hex })}
              className={cn('size-9 rounded-full border-[3px]', selected ? 'border-foreground' : 'border-transparent')}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </View>
      <Pressable accessibilityRole="button" onPress={modal.present} hitSlop={8}>
        <Text className="text-sm text-foreground-2 underline">{translate('onboarding.use_illustrated_avatar')}</Text>
      </Pressable>

      <ModalSheet ref={modal.ref} title={translate('onboarding.choose_avatar')}>
        <BottomSheetScrollView
          style={defaultStyles.transparentBg}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row flex-wrap justify-center gap-3">
            {AVATARS_LIST.map((imageSource, index) => {
              const id = index + 1;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    updateProfile({ avatar: id });
                    modal.close();
                  }}
                  className={cn('rounded-full p-1', id === avatar ? 'border-2 border-foreground' : 'border border-transparent')}
                  accessibilityLabel={translate('onboarding.choose_avatar')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: id === avatar }}
                >
                  <Image source={imageSource} className="size-16 rounded-full" />
                </Pressable>
              );
            })}
          </View>
        </BottomSheetScrollView>
      </ModalSheet>
    </View>
  );
}

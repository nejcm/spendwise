/* eslint-disable react-refresh/only-export-components */
import type { BottomSheetBackdropProps, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { BottomSheetModal, useBottomSheet } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_WEB } from '@/lib/base';

import { defaultStyles } from '@/lib/theme/styles';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { X } from './icon';
import { Text } from './text';

export type ModalSheetProps = BottomSheetModalProps & {
  title?: React.ReactNode;
};

type ModalSheetRef<T> = React.ForwardedRef<BottomSheetModal<T>>;

export type ModalSheetHeaderProps = {
  title?: React.ReactNode;
  dismiss: () => void;
};

export function useModalSheet<T>() {
  const ref = React.useRef<BottomSheetModal<T>>(null);
  const present = React.useCallback((data?: any) => {
    ref.current?.present(data);
  }, []);
  const dismiss = React.useCallback(() => {
    ref.current?.dismiss();
  }, []);
  return { ref, present, dismiss };
}

export function ModalSheet<T>({
  ref,
  snapPoints: _snapPoints = ['60%'] as (string | number)[],
  title,
  detached = false,
  bottomInset: providedBottomInset,
  ...props
}: ModalSheetProps & { ref?: ModalSheetRef<T> }) {
  const theme = useThemeConfig();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const detachedProps = React.useMemo(() => getDetachedProps(detached), [detached]);
  const modal = useModalSheet<T>();
  const snapPoints = React.useMemo(() => _snapPoints, [_snapPoints]);
  const sheetBottomInset = providedBottomInset ?? (detached ? Math.max(bottomInset + 12, 46) : bottomInset);

  React.useImperativeHandle(ref, () => (modal.ref.current as BottomSheetModal<T>) || null);

  const renderHandleComponent = React.useCallback(
    () => (
      <>
        <View className={`mt-2 ${title ? 'mb-2' : 'mb-8'} h-1 w-12 self-center rounded-lg bg-gray-300 dark:bg-gray-700`} />
        <ModalSheetHeader title={title} dismiss={modal.dismiss} />
      </>
    ),
    [title, modal.dismiss],
  );

  return (
    <BottomSheetModal
      {...props}
      {...detachedProps}
      backgroundStyle={theme.dark ? defaultStyles.backgroundDark : defaultStyles.background}
      ref={modal.ref}
      index={0}
      snapPoints={snapPoints}
      bottomInset={sheetBottomInset}
      backdropComponent={props.backdropComponent || renderBackdrop}
      enableDynamicSizing={false}
      handleComponent={renderHandleComponent}
      overDragResistanceFactor={IS_WEB ? 0.5 : props.overDragResistanceFactor}
    />
  );
}

/**
 * Custom Backdrop
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CustomBackdrop({ style }: BottomSheetBackdropProps) {
  const { close } = useBottomSheet();
  return (
    <AnimatedPressable
      onPress={() => close()}
      entering={FadeIn.duration(50)}
      exiting={FadeOut.duration(20)}
      style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
    />
  );
}

export function renderBackdrop(props: BottomSheetBackdropProps) {
  return <CustomBackdrop {...props} />;
}

/**
 * In case the modal is detached, we need to add some extra props to the modal to make it look like a detached modal.
 */
function getDetachedProps(detached: boolean) {
  if (detached) {
    return {
      detached: true,
      style: { marginHorizontal: 16, overflow: 'hidden' },
    } as Partial<BottomSheetModalProps>;
  }
  return {} as Partial<BottomSheetModalProps>;
}

const ModalSheetHeader = React.memo(({ title, dismiss }: ModalSheetHeaderProps) => {
  return (
    <>
      {title && (
        <View className="flex-row px-2 py-4">
          <View className="flex-1">
            {typeof title === 'string' ? <Text className="text-center text-lg font-bold text-foreground">{title}</Text> : title}
          </View>
        </View>
      )}
      <CloseButton close={dismiss} />
    </>
  );
});

export function CloseButton({ close }: { close: () => void }) {
  return (
    <Pressable
      onPress={close}
      className="absolute top-3 right-3 size-6 items-center justify-center"
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      accessibilityLabel="close modal"
      accessibilityRole="button"
      accessibilityHint="closes the modal"
    >
      <X size={20} colorClassName="accent-foreground" />
    </Pressable>
  );
}

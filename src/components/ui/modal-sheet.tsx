/* eslint-disable react-refresh/only-export-components */
import type { BottomSheetBackdropProps, BottomSheetModalProps } from '@gorhom/bottom-sheet';
import { BottomSheetModal, useBottomSheet } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';
import { IS_WEB } from '@/lib/base';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { X } from './icon';
import { Text } from './text';

export type ModalSheetProps = BottomSheetModalProps & {
  title?: React.ReactNode;
};

export type ModalSheetRef<T> = React.ForwardedRef<BottomSheetModal<T>>;

export type ModalSheetHeaderProps = {
  title?: React.ReactNode;
  close: () => void;
};

export function useModalSheet<T>() {
  const ref = React.useRef<BottomSheetModal<T>>(null);
  const present = React.useCallback((data?: any) => {
    ref.current?.present(data);
  }, []);
  const close = React.useCallback(() => {
    ref.current?.close();
  }, []);
  return { ref, present, close };
}

const defaultSnapPoints = ['66%'];
const SHEET_RADIUS = 28;

export function ModalSheet<T>({
  ref,
  snapPoints = defaultSnapPoints,
  title,
  detached = false,
  bottomInset: providedBottomInset,
  ...props
}: ModalSheetProps & { ref?: ModalSheetRef<T> }) {
  const sheetColor = useCSSVariable('--color-sheet') as string | undefined;
  const { bottom: bottomInset } = useSafeAreaInsets();
  const detachedProps = React.useMemo(() => getDetachedProps(detached), [detached]);
  const backgroundStyle = React.useMemo(() => ({
    backgroundColor: sheetColor,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    borderBottomLeftRadius: detached ? SHEET_RADIUS : 0,
    borderBottomRightRadius: detached ? SHEET_RADIUS : 0,
  }), [sheetColor, detached]);
  const modal = useModalSheet<T>();
  const sheetBottomInset = providedBottomInset ?? (detached ? bottomInset + 12 : bottomInset);

  React.useImperativeHandle(ref, () => (modal.ref.current as BottomSheetModal<T>) || null);

  const renderHandleComponent = React.useCallback(
    () => (
      <>
        <View className="mt-2.5 h-1.25 w-10 self-center rounded-full bg-track" />
        <ModalSheetHeader title={title} close={modal.close} />
      </>
    ),
    [title, modal.close],
  );

  return (
    <BottomSheetModal
      {...props}
      {...detachedProps}
      backgroundStyle={backgroundStyle}
      ref={modal.ref}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      bottomInset={sheetBottomInset}
      backdropComponent={props.backdropComponent || renderBackdrop}
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
  const scrim = useCSSVariable('--color-scrim') as string | undefined;
  return (
    <AnimatedPressable
      onPress={() => close()}
      entering={FadeIn.duration(50)}
      exiting={FadeOut.duration(20)}
      style={[style, { backgroundColor: scrim }]}
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

const ModalSheetHeader = React.memo(({ title, close }: ModalSheetHeaderProps) => {
  return (
    <View className="flex-row items-center gap-3 px-5 pt-3 pb-2">
      <View className="flex-1">
        {typeof title === 'string' ? <Text accessibilityRole="header" className="text-xl font-bold">{title}</Text> : title}
      </View>
      <CloseButton close={close} />
    </View>
  );
});

export function CloseButton({ close, className }: { close: () => void; className?: string }) {
  return (
    <Pressable
      onPress={close}
      className={cn('size-10 items-center justify-center rounded-full bg-card-2', className)}
      hitSlop={8}
      accessibilityLabel={translate('common.close')}
      accessibilityRole="button"
    >
      <X size={20} colorClassName="accent-foreground" />
    </Pressable>
  );
}

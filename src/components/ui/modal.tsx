import type { ModalProps as RNModalProps } from 'react-native';
import { Modal as RNModal } from 'react-native';
import { cn } from 'tailwind-variants';
import { CloseButton, View } from './';

export type ModalProps = RNModalProps & {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
};

export function Modal({ children, className, onClose, ...rest }: ModalProps) {
  return (
    <RNModal
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (onClose) onClose();
      }}
      {...rest}
    >
      <View className="flex-1 items-center justify-center bg-black/60">
        <View className={cn('relative flex-col items-center justify-center rounded-xl bg-background p-6', className)}>
          {onClose && <CloseButton close={onClose} />}
          {children}
        </View>
      </View>
    </RNModal>
  );
}

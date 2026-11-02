import type { ModalProps as RNModalProps } from 'react-native';
import { Modal as RNModal, View } from 'react-native';
import { cn } from '@/lib/cn';
import { CloseButton } from './modal-sheet';

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
          {onClose && <CloseButton close={onClose} className="absolute top-3 right-3" />}
          {children}
        </View>
      </View>
    </RNModal>
  );
}

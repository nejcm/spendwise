import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { Pressable } from 'react-native';
import { tv } from 'tailwind-variants';
import { getPressedStyle } from './button';
import { buttonTv } from './solid-button';

const iconButton = tv({
  extend: buttonTv,
  slots: {
    container: 'flex flex-row items-center justify-center rounded-full p-0',
  },
  variants: {
    color: {
      none: {
        container: 'bg-transparent',
      },
    },
    size: {
      sm: {
        container: 'size-8 p-0',
        label: 'text-sm',
        indicator: 'h-2',
      },
      md: {
        container: 'size-10 p-0',
        label: 'text-base',
      },
      lg: {
        container: 'size-12 p-0',
        label: 'text-lg',
      },
      xl: {
        container: 'size-16 p-0',
        label: 'text-xl',
      },
    },
  },
  defaultVariants: {
    disabled: false,
    fullWidth: false,
    size: 'md',
  },
});

type ButtonVariants = VariantProps<typeof iconButton>;
export type IconButtonProps = {
  className?: string;
} & ButtonVariants
& Omit<PressableProps, 'disabled'>;

export function IconButton({
  ref,
  disabled = false,
  size = 'md',
  color = 'primary',
  className = '',
  testID,
  style,
  ...props
}: IconButtonProps & { ref?: React.RefObject<View | null> }) {
  const styles = React.useMemo(() => iconButton({ disabled, size, color }), [disabled, size, color]);

  return (
    <Pressable
      className={styles.container({ className })}
      style={(state) => getPressedStyle(state, style, !disabled)}
      disabled={disabled}
      {...props}
      ref={ref}
      testID={testID}
    >
      {props.children}
    </Pressable>
  );
}

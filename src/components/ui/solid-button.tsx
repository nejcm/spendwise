/* eslint-disable react-refresh/only-export-components */
import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { tv } from 'tailwind-variants';
import { Button } from './button';

export const solidButton = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-lg px-4',
    label: 'items-center font-family-sans text-base/snug font-medium',
    indicator: 'accent-background',
  },
  variants: {
    color: {
      'primary': {
        container: 'bg-foreground',
        label: 'text-background',
        indicator: 'accent-background',
      },
      'primary-alt': {
        container: 'bg-background',
        label: 'text-foreground',
        indicator: 'accent-foreground',
      },
      'secondary': {
        container: 'bg-muted',
        label: 'text-muted-foreground',
        indicator: 'accent-muted-foreground',
      },
      'secondary-alt': {
        container: 'bg-muted-foreground',
        label: 'text-foreground dark:text-background',
        indicator: 'accent-foreground dark:accent-background',
      },
      'success': {
        container: 'bg-success-600',
        label: 'text-white',
        indicator: 'accent-white',
      },
      'warning': {
        container: 'bg-warning-600',
        label: 'text-white',
        indicator: 'accent-white',
      },
      'danger': {
        container: 'bg-danger-600',
        label: 'text-white',
        indicator: 'accent-white',
      },
    },
    size: {
      xs: {
        container: 'h-6 px-2',
        label: 'text-xs/snug font-normal',
        indicator: 'size-2',
      },
      sm: {
        container: 'h-9 px-3',
        label: 'text-sm/snug',
        indicator: 'size-3',
      },
      md: {
        container: 'h-11 px-4',
        label: 'text-base/snug',
        indicator: 'size-4',
      },
      lg: {
        container: 'h-13 px-5',
        label: 'text-lg/snug',
        indicator: 'size-5',
      },
      xl: {
        container: 'h-16 px-6',
        label: 'text-xl/snug',
        indicator: 'size-6',
      },
    },
    disabled: {
      true: {
        container: 'opacity-40',
        label: 'text-gray-600 dark:text-gray-600',
        indicator: 'text-gray-400 dark:text-gray-400',
      },
    },
    fullWidth: {
      true: {
        container: 'w-full',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    disabled: false,
    fullWidth: false,
    size: 'md',
  },
});

type ButtonVariants = VariantProps<typeof solidButton>;
export type SolidButtonProps = {
  label?: string;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  textClassName?: string;
} & ButtonVariants
& Omit<PressableProps, 'disabled'>;

export function SolidButton({
  ref,
  className = '',
  color = 'primary',
  disabled = false,
  fullWidth = false,
  loading = false,
  size = 'md',
  textClassName = '',
  ...props
}: SolidButtonProps & { ref?: React.RefObject<View | null> }) {
  const styles = React.useMemo(() => solidButton({ disabled, size, color, fullWidth }), [disabled, size, color, fullWidth]);

  return (
    <Button
      disabled={disabled || loading}
      loading={loading}
      className={styles.container({ className })}
      indicatorClassName={styles.indicator()}
      indicatorSize={size === 'xs' || size === 'sm' || size === 'md' ? 'small' : 'large'}
      textClassName={styles.label({ className: textClassName })}
      {...props}
      ref={ref}
    />
  );
}

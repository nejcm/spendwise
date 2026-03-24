import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { tv } from 'tailwind-variants';
import { Button } from './button';
import { solidButton } from './solid-button';

const outlineButton = tv({
  extend: solidButton,
  slots: {
    container: 'flex flex-row items-center justify-center rounded-lg border bg-transparent px-4',
  },
  variants: {
    color: {
      'primary': {
        container: 'border-foreground/80 bg-transparent',
        label: 'text-foreground',
        indicator: 'text-foreground',
      },
      'secondary': {
        container: 'border-muted-foreground/80 bg-transparent',
        label: 'text-muted-foreground',
        indicator: 'text-muted-foreground',
      },
      'primary-alt': {
        container: 'border-background/80 bg-transparent',
        label: 'text-background',
        indicator: 'text-background',
      },
      'secondary-alt': {
        container: 'border-muted/80 bg-transparent',
        label: 'text-muted',
        indicator: 'text-muted',
      },
      'success': {
        container: 'border-success-600 bg-transparent',
        label: 'text-success-600',
        indicator: 'text-success-600',
      },
      'warning': {
        container: 'border-warning-600 bg-transparent',
        label: 'text-warning-600',
        indicator: 'text-warning-600',
      },
      'danger': {
        container: 'border-danger-600 bg-transparent',
        label: 'text-danger-600',
        indicator: 'text-danger-600',
      },
    },
    disabled: {
      true: {
        container: 'opacity-40',
        label: 'text-gray-300 dark:text-gray-400',
        indicator: 'text-gray-300 dark:text-gray-400',
      },
    },
  },
});

type ButtonVariants = VariantProps<typeof outlineButton>;
export type OutlineButtonProps = {
  label?: string;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  textClassName?: string;
} & ButtonVariants
& Omit<PressableProps, 'disabled' | 'color' | 'size'>;

export function OutlineButton({
  ref,
  className = '',
  color = 'primary',
  disabled = false,
  fullWidth = false,
  loading = false,
  size = 'md',
  textClassName = '',
  ...props
}: OutlineButtonProps & { ref?: React.RefObject<View | null> }) {
  const styles = React.useMemo(() => outlineButton({ disabled, size, color, fullWidth }), [disabled, size, color, fullWidth]);

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

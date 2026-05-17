import type { PressableProps, TextProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { tv } from 'tailwind-variants';
import { Button, buttonTv } from './button';

const outlineButton = tv({
  extend: buttonTv,
  slots: {
    container: 'flex flex-row items-center justify-center rounded-lg border bg-transparent px-4',
  },
  variants: {
    color: {
      'primary': {
        container: 'border-primary/80 bg-transparent',
        label: 'text-primary',
        indicator: 'text-primary',
      },
      'default': {
        container: 'border-foreground/80 bg-transparent',
        label: 'text-foreground',
        indicator: 'text-foreground',
      },
      'default-alt': {
        container: 'border-background/80 bg-transparent',
        label: 'text-background',
        indicator: 'text-background',
      },
      'secondary': {
        container: 'border-muted-foreground/80 bg-transparent',
        label: 'text-muted-foreground',
        indicator: 'text-muted-foreground',
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
  textProps?: TextProps;
} & ButtonVariants
& Omit<PressableProps, 'disabled' | 'color' | 'size'>;

export function OutlineButton({
  ref,
  className = '',
  color = 'default',
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

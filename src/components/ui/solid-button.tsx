import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { Button, buttonTv } from './button';

type ButtonVariants = VariantProps<typeof buttonTv>;
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
  const styles = React.useMemo(() => buttonTv({ disabled, size, color, fullWidth }), [disabled, size, color, fullWidth]);

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

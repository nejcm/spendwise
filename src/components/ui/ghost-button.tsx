import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { tv } from 'tailwind-variants';
import { solidButton } from './button';

const outlineButton = tv({
  extend: solidButton,
  slots: {
    container: 'flex flex-row items-center justify-center rounded-lg border-0 px-4',
  },
  variants: {
    color: {
      'primary': {
        container: 'bg-transparent',
        label: 'text-foreground',
        indicator: 'text-foreground',
      },
      'primary-alt': {
        container: 'bg-transparent',
        label: 'text-background',
        indicator: 'text-background',
      },
      'secondary': {
        container: 'bg-transparent',
        label: 'text-muted-foreground',
        indicator: 'text-muted-foreground',
      },
      'secondary-alt': {
        container: 'bg-transparent',
        label: 'text-muted-foreground',
        indicator: 'text-muted-foreground',
      },
      'success': {
        container: 'bg-transparent',
        label: 'text-success-600',
        indicator: 'text-success-600',
      },
      'warning': {
        container: 'bg-transparent',
        label: 'text-warning-600',
        indicator: 'text-warning-600',
      },
      'danger': {
        container: 'bg-transparent',
        label: 'text-danger-600',
        indicator: 'text-danger-600',
      },
    },
    disabled: {
      true: {
        container: '',
        label: 'text-gray-300 dark:text-gray-400',
        indicator: 'text-gray-300 dark:text-gray-400',
      },
    },
  },
  defaultVariants: {
    disabled: false,
    fullWidth: false,
    size: 'md',
  },
});

type ButtonVariants = VariantProps<typeof outlineButton>;
export type GhostButtonProps = {
  label?: string;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  textClassName?: string;
} & ButtonVariants
& Omit<PressableProps, 'disabled' | 'color' | 'size'>;

export function GhostButton({
  ref,
  iconLeft,
  iconRight,
  label: text,
  loading = false,
  disabled = false,
  size = 'md',
  color = 'primary',
  className = '',
  testID,
  textClassName = '',
  ...props
}: GhostButtonProps & { ref?: React.RefObject<View | null> }) {
  const styles = React.useMemo(() => outlineButton({ disabled, size, color }), [disabled, size, color]);

  return (
    <Pressable
      disabled={disabled || loading}
      className={styles.container({ className })}
      {...props}
      ref={ref}
      testID={testID}
    >
      {props.children || (
        <>
          {loading
            ? (
                <ActivityIndicator
                  size="small"
                  className={styles.indicator()}
                  testID={testID ? `${testID}-activity-indicator` : undefined}
                />
              )
            : (
                <>
                  {iconLeft}
                  <Text
                    testID={testID ? `${testID}-label` : undefined}
                    className={styles.label({ className: textClassName })}
                  >
                    {text}
                  </Text>
                  {iconRight}
                </>
              )}
        </>
      )}
    </Pressable>
  );
}

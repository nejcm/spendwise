import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { tv } from 'tailwind-variants';
import { solidButton } from './button';

const outlineButton = tv({
  extend: solidButton,
  slots: {
    container: 'flex flex-row items-center justify-center rounded-lg border bg-transparent px-4',
  },
  variants: {
    color: {
      'primary': {
        container: 'border-foreground bg-transparent',
        label: 'text-foreground',
        indicator: 'text-foreground',
      },
      'secondary': {
        container: 'border-muted-foreground bg-transparent',
        label: 'text-muted-foreground',
        indicator: 'text-muted-foreground',
      },
      'primary-alt': {
        container: 'border-background bg-transparent',
        label: 'text-background',
        indicator: 'text-background',
      },
      'secondary-alt': {
        container: 'border-muted bg-transparent',
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
        container: 'border-gray-300 dark:border-gray-400',
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
  iconLeft,
  iconRight,
  label: text,
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  className = '',
  testID,
  textClassName = '',
  color = 'primary',
  ...props
}: OutlineButtonProps & { ref?: React.RefObject<View | null> }) {
  const styles = React.useMemo(() => outlineButton({ disabled, size, color, fullWidth }), [disabled, size, color, fullWidth]);

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

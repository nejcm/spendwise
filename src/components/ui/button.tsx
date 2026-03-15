import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { tv } from 'tailwind-variants';

// eslint-disable-next-line react-refresh/only-export-components
export const solidButton = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-md px-4',
    label: 'items-center font-family-sans text-base/snug font-medium',
    indicator: 'h-6 text-white',
  },
  variants: {
    color: {
      'primary': {
        container: 'bg-foreground',
        label: 'text-background',
        indicator: 'text-background',
      },
      'secondary': {
        container: 'bg-muted',
        label: 'text-foreground',
        indicator: 'text-foreground',
      },
      'primary-alt': {
        container: 'bg-background',
        label: 'text-foreground',
        indicator: 'text-foreground',
      },
      'secondary-alt': {
        container: 'bg-muted-foreground',
        label: 'text-foreground dark:text-background',
        indicator: 'text-foreground dark:text-background',
      },
      'success': {
        container: 'bg-success-600',
        label: 'text-white',
        indicator: 'text-white',
      },
      'warning': {
        container: 'bg-warning-600',
        label: 'text-white',
        indicator: 'text-white',
      },
      'danger': {
        container: 'bg-danger-600',
        label: 'text-white',
        indicator: 'text-white',
      },
    },
    size: {
      xs: {
        container: 'h-6 px-2',
        label: 'text-xs/snug font-normal',
        indicator: 'h-1.5',
      },
      sm: {
        container: 'h-9 px-3',
        label: 'text-sm/snug',
        indicator: 'h-2',
      },
      md: {
        container: 'h-11 px-4',
        label: 'text-base/snug',
      },
      lg: {
        container: 'h-13 px-5',
        label: 'text-lg/snug',
      },
      xl: {
        container: 'h-16 px-6',
        label: 'text-xl/snug',
      },
    },
    disabled: {
      true: {
        container: 'bg-gray-300 dark:bg-gray-300',
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
}: SolidButtonProps & { ref?: React.RefObject<View | null> }) {
  const styles = React.useMemo(() => solidButton({ disabled, size, color, fullWidth }), [disabled, size, color, fullWidth]);

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

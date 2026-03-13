/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { PressableProps, View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { tv } from 'tailwind-variants';

const button = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-md px-4 text-black dark:text-white',
    label: 'font-family-sans text-base font-medium',
    indicator: 'h-6 text-white',
  },

  variants: {
    variant: {
      unstyled: {
        container: 'bg-transparent',
        label: 'text-black dark:text-white',
        indicator: 'text-black dark:text-white',
      },
      default: {
        container: 'bg-black dark:bg-white',
        label: 'text-white dark:text-black',
        indicator: 'text-white dark:text-black',
      },
      secondary: {
        container: 'bg-primary-600',
        label: 'text-secondary-600',
        indicator: 'text-white',
      },
      outline: {
        container: 'border border-gray-400',
        label: 'text-black dark:text-gray-100',
        indicator: 'text-black dark:text-gray-100',
      },
      destructive: {
        container: 'bg-red-600',
        label: 'text-white',
        indicator: 'text-white',
      },
      ghost: {
        container: 'bg-transparent',
        label: 'text-black underline dark:text-white',
        indicator: 'text-black dark:text-white',
      },
      link: {
        container: 'bg-transparent',
        label: 'text-black',
        indicator: 'text-black',
      },
    },
    size: {
      sm: {
        container: 'h-8 px-3',
        label: 'text-sm',
        indicator: 'h-2',
      },
      default: {
        container: 'h-10 px-4',
        label: 'text-base',
      },
      lg: {
        container: 'h-14 px-6',
        label: 'text-lg',
      },
      xl: {
        container: 'h-16 px-8',
        label: 'text-xl',
      },
      icon: { container: 'size-9' },
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
        container: '',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: true,
    size: 'default',
  },
});

type ButtonVariants = VariantProps<typeof button>;
export type ButtonProps = {
  label?: string;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  textClassName?: string;
} & ButtonVariants
& Omit<PressableProps, 'disabled'>;

export function Button({
  ref,
  iconLeft,
  iconRight,
  label: text,
  loading = false,
  variant = 'default',
  disabled = false,
  size = 'default',
  className = '',
  testID,
  textClassName = '',
  ...props
}: ButtonProps & { ref?: React.RefObject<View | null> }) {
  const styles = React.useMemo(() => button({ variant, disabled, size }), [variant, disabled, size]);

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

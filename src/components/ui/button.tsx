/* eslint-disable react-refresh/only-export-components */
import type { PressableProps, PressableStateCallbackType, StyleProp, View, ViewStyle } from 'react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { tv } from 'tailwind-variants';

export const buttonTv = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-lg px-4',
    label: 'items-center text-center font-family-sans text-base/tight font-medium',
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
      'xs': {
        container: 'h-8 px-2',
        label: 'text-xs/tight font-normal',
        indicator: 'size-2',
      },
      'sm': {
        container: 'h-10 px-3',
        label: 'text-sm/tight',
        indicator: 'size-3',
      },
      'md': {
        container: 'h-12 px-4',
        label: 'text-base/tight',
        indicator: 'size-4',
      },
      'lg': {
        container: 'h-14 px-5',
        label: 'text-lg/tight',
        indicator: 'size-5',
      },
      'xl': {
        container: 'h-16 px-6',
        label: 'text-xl/tight',
        indicator: 'size-6',
      },
      '2xl': {
        container: 'h-18 px-7',
        label: 'text-xl/tight',
        indicator: 'size-7',
      },
    },
    disabled: {
      true: {
        container: 'opacity-40',
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

export function getPressedStyle(state: PressableStateCallbackType, style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>), enabled = true): StyleProp<ViewStyle> {
  return [
    typeof style === 'function' ? style(state) : style,
    state.pressed && enabled && { opacity: 0.7 },
  ];
}

export type ButtonProps = {
  label?: string;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  indicatorClassName?: string;
  textClassName?: string;
  indicatorSize?: 'small' | 'large' | number;
} & PressableProps;

export function Button({
  ref,
  iconLeft,
  iconRight,
  label: text,
  loading = false,
  testID,
  textClassName = '',
  indicatorClassName = '',
  indicatorSize = 'small',
  style,
  disabled = false,
  ...props
}: ButtonProps & { ref?: React.RefObject<View | null> }) {
  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => getPressedStyle(state, style, !(disabled || loading))}
      {...props}
      ref={ref}
      testID={testID}
    >
      {props.children || (
        <>
          {loading
            ? (
                <ActivityIndicator
                  size={indicatorSize}
                  className={indicatorClassName}
                  testID={testID ? `${testID}-activity-indicator` : undefined}
                />
              )
            : (
                <>
                  {iconLeft}
                  <Text
                    testID={testID ? `${testID}-label` : undefined}
                    className={textClassName}
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

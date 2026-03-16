/* eslint-disable react-refresh/only-export-components */

import type { TextInputProps } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { I18nManager, TextInput as NTextInput, StyleSheet, View } from 'react-native';
import { cn, tv } from 'tailwind-variants';
import { Text } from './text';

export const inputDefaults = 'rounded-lg border font-family-sans focus:outline-none';
export const inputDefaultDefaults = 'border-border bg-input text-foreground focus:border-gray-800 focus:dark:border-gray-300';
export const labelDefaults = 'text-foreground mb-1 text-sm/snug';

export const inputTv = tv({
  slots: {
    container: '',
    label: labelDefaults,
    input:
      inputDefaults,
  },
  variants: {
    color: {
      default: {
        input: inputDefaultDefaults,
      },
      secondary: {
        input: 'border-gray-300 bg-gray-200 focus:border-gray-800 dark:border-border dark:bg-input dark:text-foreground focus:dark:border-gray-300',
      },
    },
    size: {
      xs: {
        input: 'h-6 px-2 text-xs/snug',
        label: 'text-xs/snug',
      },
      sm: {
        input: 'h-9 px-3 text-sm/snug',
        label: 'text-xs/snug',
      },
      md: {
        input: 'h-11 px-3 text-base/snug',
        label: 'text-sm/snug',
      },
      lg: {
        input: 'h-13 px-4 text-lg/snug',
        label: 'text-base/snug',
      },
      xl: {
        input: 'h-16 px-5 text-xl/snug',
        label: 'text-lg/snug',
      },
    },
    variant: {
      default: {
        input: '',
      },
      textarea: {
        input: 'h-auto min-h-[100]',
      },
    },
    focused: {
      true: {
        input: '',
      },
    },
    error: {
      true: {
        input: 'border-danger-600 focus:border-danger-600 dark:border-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-gray-100 dark:bg-gray-950',
      },
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
    focused: false,
    error: false,
    disabled: false,
  },
});

export type InputProps = {
  label?: string;
  disabled?: boolean;
  error?: string;
  containerClassName?: string;
  rightSection?: React.ReactNode;
} & Omit<VariantProps<typeof inputTv>, 'error'> & Omit<TextInputProps, 'size'>;

export function Input({ ref, ...props }: InputProps & { ref?: React.Ref<NTextInput | null> }) {
  const { label, error, size = 'md', value = '', color = 'default', testID, onBlur: onBlurProp, onFocus: onFocusProp, containerClassName, rightSection, className, ...inputProps } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);

  const onBlur = React.useCallback(
    (e: any) => {
      setIsFocussed(false);
      onBlurProp?.(e);
    },
    [onBlurProp],
  );

  const onFocus = React.useCallback(
    (e: any) => {
      setIsFocussed(true);
      onFocusProp?.(e);
    },
    [onFocusProp],
  );

  const styles = inputTv({
    error: Boolean(error),
    focused: isFocussed,
    disabled: Boolean(props.disabled),
    size,
    color,
  });

  return (
    <View className={cn(styles.container(), containerClassName)}>
      {label && (
        <Text testID={testID ? `${testID}-label` : undefined} className={styles.label()}>
          {label}
        </Text>
      )}
      <View className="relative">
        <NTextInput
          testID={testID}
          ref={ref}
          placeholderTextColor="#6b7280"
          onBlur={onBlur}
          onFocus={onFocus}
          value={value}
          {...inputProps}
          className={cn(styles.input(), rightSection && 'pr-10', className)}
          style={StyleSheet.flatten([
            { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
            { textAlign: I18nManager.isRTL ? 'right' : 'left' },
            inputProps.style,
          ])}
        />
        {rightSection && (
          <View className="absolute inset-y-0 right-3 bottom-0 justify-center">
            {rightSection}
          </View>
        )}
      </View>
      {error && (
        <View className="absolute top-full left-0 mt-0.5">
          <Text testID={testID ? `${testID}-error` : undefined} className="text-xs text-danger-500">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

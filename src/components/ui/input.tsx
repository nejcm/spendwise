/* eslint-disable react-refresh/only-export-components */

import type { BlurEvent, FocusEvent, TextInputProps } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { I18nManager, TextInput as NTextInput, StyleSheet, View } from 'react-native';
import { cn, tv } from 'tailwind-variants';
import { InputLabel, labelDefaults } from './input-label';
import { Text } from './text';

export const inputDefaults = 'rounded-lg border font-family-sans focus:outline-none';
export const inputDefaultDefaults = 'border-border bg-input text-foreground';

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
        input: 'border-gray-300 bg-gray-200 dark:border-border dark:bg-input dark:text-foreground',
      },
    },
    size: {
      xs: {
        input: 'h-8 px-2 text-xs/snug',
        label: 'text-xs/snug',
      },
      sm: {
        input: 'h-10 px-3 text-sm/snug',
        label: 'text-xs/snug',
      },
      md: {
        input: 'h-14 px-3 text-base/snug',
        label: 'text-base/snug',
      },
      lg: {
        input: 'h-16 px-4 text-lg/snug',
        label: 'text-lg/snug',
      },
      xl: {
        input: 'h-18 px-5 text-xl/snug',
        label: 'text-lg/snug',
      },
    },
    variant: {
      default: {
        input: '',
      },
      textarea: {
        input: 'h-auto min-h-[100] items-start justify-start py-2',
      },
    },
    focused: {
      true: {
        input: 'focus:border-gray-800 focus:dark:border-gray-300',
      },
    },
    error: {
      true: {
        input: 'border-danger-600 focus:border-danger-600 dark:border-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'opacity-50',
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
  showErrorMessage?: boolean;
} & Omit<VariantProps<typeof inputTv>, 'error'> & Omit<TextInputProps, 'size'>;

export function Input({ ref, showErrorMessage = true, ...props }: InputProps & { ref?: React.Ref<NTextInput | null> }) {
  const { label, error, size = 'md', value, color = 'default', testID, onBlur: onBlurProp, onFocus: onFocusProp, containerClassName, rightSection, className, variant, ...inputProps } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);

  const onBlur = React.useCallback(
    (e: BlurEvent) => {
      setIsFocussed(false);
      onBlurProp?.(e);
    },
    [onBlurProp],
  );

  const onFocus = React.useCallback(
    (e: FocusEvent) => {
      setIsFocussed(true);
      onFocusProp?.(e);
    },
    [onFocusProp],
  );

  const styles = inputTv({
    error: Boolean(error),
    focused: isFocussed,
    disabled: Boolean(props.disabled),
    variant,
    size,
    color,
  });

  return (
    <View className={cn(styles.container(), containerClassName)}>
      {label && (
        <InputLabel label={label} testID={testID ? `${testID}-label` : undefined} className={styles.label()} />
      )}
      <View className="relative">
        <NTextInput
          testID={testID}
          ref={ref}
          placeholderTextColor="#6b7280"
          onBlur={onBlur}
          onFocus={onFocus}
          {...inputProps}
          {...(value !== undefined ? { value } : {})}
          className={cn(styles.input(), rightSection && 'pr-10', className)}
          style={StyleSheet.flatten([
            { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
            { outlineStyle: 'solid' as const },
            { outlineWidth: 0 },
            { textAlignVertical: variant === 'textarea' ? 'top' : undefined },
            inputProps.style,
          ])}
        />
        {rightSection && (
          <View className="absolute inset-y-0 right-3 bottom-0 justify-center">
            {rightSection}
          </View>
        )}
      </View>
      {error && !!showErrorMessage && (
        <View className="absolute top-full left-0 mt-0.25">
          <Text testID={testID ? `${testID}-error` : undefined} className="text-[9px] text-danger-500">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

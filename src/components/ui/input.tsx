/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { TextInputProps } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import * as React from 'react';
import { I18nManager, TextInput as NTextInput, StyleSheet, View } from 'react-native';
import { cn, tv } from 'tailwind-variants';
import { Text } from './text';

const inputTv = tv({
  slots: {
    container: '',
    label: 'text-grey-100 mb-1 text-sm font-medium dark:text-neutral-100',
    input:
      'rounded-md border border-neutral-300 bg-input px-4 py-3 font-family-sans text-base/5 focus:border-foreground focus:outline-none dark:border-neutral-700 dark:text-white',
  },
  variants: {
    size: {
      sm: {
        label: 'text-xs',
        input: 'px-3 py-2 text-sm/tight',
      },
      default: {
        label: 'text-sm',
        input: 'px-4 py-2 text-base/tight',
      },
      lg: {
        label: 'text-md',
        input: 'px-5 py-3 text-xl/tight',
      },
      xl: {
        label: 'text-lg',
        input: 'px-6 py-3 text-2xl/tight',
      },
    },
    focused: {
      true: {
        input: 'border-neutral-400 dark:border-neutral-300',
      },
    },
    error: {
      true: {
        input: 'border-danger-600',
        label: 'text-danger-600 dark:text-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200',
      },
    },
  },
  defaultVariants: {
    size: 'default',
    focused: false,
    error: false,
    disabled: false,
  },
});

export type NInputProps = {
  label?: string;
  disabled?: boolean;
  error?: string;
  containerClassName?: string;
} & VariantProps<typeof inputTv> & Omit<TextInputProps, 'size'>;

export function Input({ ref, ...props }: NInputProps & { ref?: React.Ref<NTextInput | null> }) {
  const { label, error, size = 'default', testID, onBlur: onBlurProp, onFocus: onFocusProp, containerClassName, ...inputProps } = props;
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
  });

  return (
    <View className={cn(styles.container(), containerClassName)}>
      {label && (
        <Text testID={testID ? `${testID}-label` : undefined} className={styles.label()}>
          {label}
        </Text>
      )}
      <NTextInput
        testID={testID}
        ref={ref}
        placeholderTextColor="var(--color-neutral-400)"
        onBlur={onBlur}
        onFocus={onFocus}
        {...inputProps}
        className={cn(styles.input(), inputProps.className)}
        style={StyleSheet.flatten([
          { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
          { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          inputProps.style,
        ])}
      />
      {error && (
        <Text testID={testID ? `${testID}-error` : undefined} className="text-sm text-danger-400 dark:text-danger-600">
          {error}
        </Text>
      )}
    </View>
  );
}

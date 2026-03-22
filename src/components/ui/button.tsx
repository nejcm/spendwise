/* eslint-disable react-refresh/only-export-components */
import type { PressableProps, PressableStateCallbackType, StyleProp, View, ViewStyle } from 'react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

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

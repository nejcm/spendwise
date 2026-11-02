import type { PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import * as React from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { easeOut } from '@/lib/theme/motion';

const AnimatedPressable = withUniwind(Animated.createAnimatedComponent(Pressable));
const PRESS_TIMING = { duration: 160, easing: easeOut };

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed; dims instead when the system asks to reduce motion. */
  scaleTo?: number;
  ref?: React.Ref<View>;
};

export function PressableScale({ scaleTo = 0.97, style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const pressedStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }] }));

  // A static pressed-only style; an always-on animated opacity would override the disabled `opacity-40` class.
  if (reduceMotion) {
    return <Pressable {...props} onPressIn={onPressIn} onPressOut={onPressOut} style={(state) => [style, state.pressed && { opacity: 0.85 }]} />;
  }

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        pressed.value = withTiming(1, PRESS_TIMING);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = withTiming(0, PRESS_TIMING);
        onPressOut?.(event);
      }}
      style={[style, pressedStyle]}
    />
  );
}

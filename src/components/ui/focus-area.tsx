import type { PressableProps, TextInput, View } from 'react-native';
import * as React from 'react';
import { Pressable } from 'react-native';

type FocusAreaProps = Omit<PressableProps, 'onPress' | 'accessible'> & {
  ref?: React.Ref<View>;
  target: React.RefObject<TextInput | null>;
  className?: string;
};

/** Widens an input's tap target: tapping anywhere inside focuses `target`. Nested buttons keep their own press. */
export function FocusArea({ target, ...props }: FocusAreaProps) {
  return <Pressable accessible={false} onPress={() => target.current?.focus()} {...props} />;
}

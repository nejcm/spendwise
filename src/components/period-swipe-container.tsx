import type { PeriodSelection } from '@/lib/store';
import * as React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { isNavigablePeriodMode, navigatePeriod } from '@/lib/date/helpers';
import { setPeriodSelection } from '@/lib/store';

export type PeriodSwipeContainerProps = {
  selection: PeriodSelection;
  children: React.ReactNode;
};

export function PeriodSwipeContainer({ selection, children }: PeriodSwipeContainerProps) {
  const isFixed = !isNavigablePeriodMode(selection.mode);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .runOnJS(true)
    .onUpdate((event) => {
      if (isFixed) return;
      translateX.value = Math.max(-12, Math.min(12, event.translationX * 0.2));
      opacity.value = Math.max(0.7, 1 - Math.abs(event.translationX) / 300);
    })
    .onEnd((event) => {
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 80 });
      if (isFixed) return;
      if (event.translationX < -50) {
        setPeriodSelection(navigatePeriod(selection, 1));
      }
      else if (event.translationX > 50) {
        setPeriodSelection(navigatePeriod(selection, -1));
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

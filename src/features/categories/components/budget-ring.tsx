import type { BudgetState } from '@/components/ui/budget-state';
import * as React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui';
import { hexWithOpacity } from '@/lib/theme/colors';
import { useBudgetColors } from '../hooks';

const SIZE = 42;
const RADIUS = 19;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BudgetRing({ ratio, state, icon, color }: { ratio: number; state: BudgetState; icon: string; color: string }) {
  const colors = useBudgetColors();
  return (
    <View className="size-[42px] items-center justify-center">
      {state !== 'none' && (
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={21} cy={21} r={RADIUS} fill="none" stroke={colors.track} strokeWidth={3} />
          <Circle
            cx={21}
            cy={21}
            r={RADIUS}
            fill="none"
            stroke={colors[state]}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${Math.min(1, ratio) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          />
        </Svg>
      )}
      <View className="size-8 items-center justify-center rounded-full" style={{ backgroundColor: hexWithOpacity(color, 26) }}>
        <Text className="text-base">{icon}</Text>
      </View>
    </View>
  );
}

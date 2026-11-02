import type { BudgetState } from '@/components/ui/budget-state';
import * as React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '@/components/ui';
import { hexWithOpacity } from '@/lib/theme/colors';
import { useBudgetColors } from '../hooks';

const SIZE = 52;
const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function BudgetRing({ ratio, state, icon, color }: { ratio: number; state: BudgetState; icon: string; color: string }) {
  const colors = useBudgetColors();
  return (
    <View className="size-[52px] items-center justify-center">
      {state !== 'none' && (
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke={colors.track} strokeWidth={3} />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors[state]}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={`${Math.min(1, ratio) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          />
        </Svg>
      )}
      <View className="size-10 items-center justify-center rounded-full" style={{ backgroundColor: hexWithOpacity(color, 26) }}>
        <Text className="text-xl">{icon}</Text>
      </View>
    </View>
  );
}

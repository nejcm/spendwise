import type { MonthBar } from '../helpers';
import * as React from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Text } from '@/components/ui';
import { getBudgetState } from '@/components/ui/budget-state';
import { formatDateFull } from '@/features/formatting/helpers';
import { cn } from '@/lib/cn';
import { hexWithOpacity } from '@/lib/theme/colors';
import { useBudgetColors, useFormatMoney } from '../hooks';

const CHART_HEIGHT = 96;

/** Monthly totals as bars, the last one being the current month; `budget` draws a dashed line. */
export function MonthBars({ bars, budget }: { bars: MonthBar[]; budget?: number }) {
  const colors = useBudgetColors();
  const format = useFormatMoney();
  const [width, setWidth] = React.useState(0);
  const max = Math.max(1, budget ?? 0, ...bars.map((bar) => bar.value));
  const heightOf = (value: number) => Math.round((value / max) * CHART_HEIGHT);

  const fillFor = (bar: MonthBar, index: number) => {
    const state = getBudgetState(bar.value, budget);
    if (index === bars.length - 1) return colors[state];
    return state === 'over' ? hexWithOpacity(colors.over, 40) : colors.track;
  };

  return (
    <View>
      <View className="flex-row items-end gap-2" style={{ height: CHART_HEIGHT + 18 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {bars.map((bar, index) => (
          <View key={bar.month} className="flex-1 items-center justify-end gap-1">
            <Text className="text-[11px] text-muted-foreground tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
              {bar.value > 0 ? format(bar.value, 0) : ''}
            </Text>
            <View className="w-full rounded-md" style={{ height: Math.max(2, heightOf(bar.value)), backgroundColor: fillFor(bar, index) }} />
          </View>
        ))}
        {!!budget && width > 0 && (
          <Svg pointerEvents="none" width={width} height={2} style={{ position: 'absolute', left: 0, bottom: heightOf(budget) - 1 }}>
            <Line x1={0} x2={width} y1={1} y2={1} stroke={hexWithOpacity(colors.muted, 45)} strokeWidth={1.5} strokeDasharray="4 4" />
          </Svg>
        )}
      </View>
      <View className="mt-1.5 flex-row gap-2">
        {bars.map((bar, index) => (
          <Text
            key={bar.month}
            className={cn('flex-1 text-center text-meta', index === bars.length - 1 ? 'font-semibold text-foreground' : 'text-muted-foreground')}
          >
            {formatDateFull(bar.start, 'MMM')}
          </Text>
        ))}
      </View>
    </View>
  );
}

import * as React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { buildLinePath, chartPoints } from '../helpers';

type BalanceLineProps = {
  values: number[];
  accessibilityLabel: string;
  height?: number;
  testID?: string;
};

export function BalanceLine({ values, accessibilityLabel, height = 64, testID = 'home-balance-line' }: BalanceLineProps) {
  const [width, setWidth] = React.useState(0);
  const gradientId = `balance-fill-${React.useId().replace(/:/g, '')}`;
  const accent = String(useCSSVariable('--color-accent') ?? '#6b4fd8');
  const points = chartPoints(values, width, height);
  const line = buildLinePath(points);
  const end = points[points.length - 1];

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height }}
    >
      {end && (
        <Svg width={width} height={height} style={{ overflow: 'visible' }}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity={0.25} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={`${line} L${end[0]} ${height} L0 ${height} Z`} fill={`url(#${gradientId})`} />
          <Path d={line} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      )}
    </View>
  );
}

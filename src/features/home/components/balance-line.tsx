import * as React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { buildLinePath, chartPoints } from '../helpers';

type BalanceLineProps = {
  values: number[];
  accessibilityLabel: string;
  height?: number;
  /** Index of the point to ring as the low; also dots the last point. */
  lowIndex?: number;
  testID?: string;
};

export function BalanceLine({ values, accessibilityLabel, height = 64, lowIndex, testID = 'home-balance-line' }: BalanceLineProps) {
  const [width, setWidth] = React.useState(0);
  const accent = String(useCSSVariable('--color-accent') ?? '#6b4fd8');
  const card = String(useCSSVariable('--color-card') ?? '#ffffff');
  const line = buildLinePath(values, width, height);
  const points = lowIndex === undefined ? [] : chartPoints(values, width, height);
  const low = points[lowIndex ?? -1];
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
      {!!line && (
        <Svg width={width} height={height} style={{ overflow: 'visible' }}>
          <Path d={`${line} L${width} ${height} L0 ${height} Z`} fill={accent} fillOpacity={0.12} />
          <Path d={line} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {low && <Circle cx={low[0]} cy={low[1]} r={3.5} fill={card} stroke={accent} strokeWidth={2} />}
          {end && <Circle cx={end[0]} cy={end[1]} r={4} fill={accent} />}
        </Svg>
      )}
    </View>
  );
}

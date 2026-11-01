import * as React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { buildLinePath } from '../helpers';

const HEIGHT = 64;

export function BalanceLine({ values, accessibilityLabel }: { values: number[]; accessibilityLabel: string }) {
  const [width, setWidth] = React.useState(0);
  const accent = String(useCSSVariable('--color-accent') ?? '#6b4fd8');
  const line = buildLinePath(values, width, HEIGHT);

  return (
    <View
      testID="home-balance-line"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height: HEIGHT }}
    >
      {!!line && (
        <Svg width={width} height={HEIGHT}>
          <Path d={`${line} L${width} ${HEIGHT} L0 ${HEIGHT} Z`} fill={accent} fillOpacity={0.12} />
          <Path d={line} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      )}
    </View>
  );
}

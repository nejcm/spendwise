import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function PieChart({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M11 2.05V13h10.95c-.5 5.05-4.76 9-9.95 9-5.52 0-10-4.48-10-10 0-5.19 3.95-9.45 9-9.95ZM13.03 2.05C17.67 2.54 21.46 6.33 21.95 11H13.03V2.05Z"
        fill={color}
      />
    </Svg>
  );
}

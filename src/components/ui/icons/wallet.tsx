import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Wallet({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M21 7H3a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1Zm-1 11H4V9h16v9Z" fill={color} />
      <Path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" fill={color} />
      <Path d="M16 14a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill={color} />
    </Svg>
  );
}

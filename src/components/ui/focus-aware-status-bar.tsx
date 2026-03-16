import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { SystemBars } from 'react-native-edge-to-edge';
import { useUniwind } from 'uniwind';
import { IS_WEB } from '@/lib/base';

type Props = { hidden?: boolean };
export function FocusAwareStatusBar({ hidden = false }: Props) {
  const isFocused = useIsFocused();
  const { theme } = useUniwind();

  if (IS_WEB) return null;
  return isFocused ? <SystemBars style={theme === 'light' ? 'dark' : 'light'} hidden={hidden} /> : null;
}

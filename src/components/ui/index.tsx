/* eslint-disable react-refresh/only-export-components */
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { withUniwind } from 'uniwind';

export * from './button';
export * from './checkbox';
export * from './focus-aware-status-bar';
export * from './formatted-text';
export * from './ghost-button';
export * from './icon';
export * from './icon-button';
export * from './image';
export * from './input';
export * from './list';
export * from './modal';
export * from './outline-button';
export * from './progress-bar';
export * from './select';
export * from './text';
export * from './utils';

// export base components from react-native
export { ActivityIndicator, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';

// RNCSafeAreaView must be wrapped — raw export ignores Uniwind className (breaks flex-1 / layout).
export const SafeAreaView = withUniwind(RNSafeAreaView);

// Apply withUniwind to Svg to add className support
export const StyledSvg = withUniwind(Svg);

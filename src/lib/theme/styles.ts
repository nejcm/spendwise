import type { Theme } from 'expo-router/react-navigation';
import { DarkTheme as _DarkTheme, DefaultTheme } from 'expo-router/react-navigation';
import { StyleSheet } from 'react-native';

export const defaultStyles = StyleSheet.create({
  transparentBg: {
    backgroundColor: 'transparent',
  },
  background: {
    backgroundColor: '#efedf5',
  },
  backgroundDark: {
    backgroundColor: '#111214',
  },
});

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    primary: '#17151c',
    background: '#efedf5',
    card: '#ffffff',
    text: '#17151c',
    border: '#e3e0eb',
    notification: '#b42318',
  },
} satisfies Theme;

export const DarkTheme = {
  ..._DarkTheme,
  colors: {
    primary: '#d4f05a',
    background: '#111214',
    card: '#1c1d21',
    text: '#ffffff',
    border: '#26272c',
    notification: '#ff8a80',
  },
} satisfies Theme;

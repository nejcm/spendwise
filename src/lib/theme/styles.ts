import type { Theme } from 'expo-router/react-navigation';
import { DarkTheme as _DarkTheme, DefaultTheme } from 'expo-router/react-navigation';
import { StyleSheet } from 'react-native';

export const defaultStyles = StyleSheet.create({
  transparentBg: {
    backgroundColor: 'transparent',
  },
  background: {
    backgroundColor: '#fcfcfc',
  },
  backgroundDark: {
    backgroundColor: '#1A1C20',
  },
});

export const LightTheme = {
  ...DefaultTheme,
  colors: {
    primary: '#3965cc',
    background: '#fcfcfc',
    card: '#efefef',
    text: '#0a0a0a',
    border: '#e5e5e5',
    notification: '#f7f0e9',
  },
} satisfies Theme;

export const DarkTheme = {
  ..._DarkTheme,
  colors: {
    primary: '#3965cc',
    background: '#1A1C20',
    card: '#21232C',
    text: '#fafafa',
    border: '#1f222d',
    notification: '#63605d',
  },
} satisfies Theme;

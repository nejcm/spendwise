import type { Theme } from '@react-navigation/native';
import { DarkTheme as _DarkTheme, DefaultTheme } from '@react-navigation/native';
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

export const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    primary: '#ff7b1a',
    background: '#fcfcfc',
    card: '#efefef',
    text: '#0a0a0a',
    border: '#e5e5e5',
    notification: '#f7f0e9',
  },
};

export const DarkTheme: Theme = {
  ..._DarkTheme,
  colors: {
    primary: '#ff7b1a',
    background: '#1A1C20',
    card: '#21232C',
    text: '#fafafa',
    border: '#1f222d',
    notification: '#63605d',
  },
};

/* eslint-disable no-alert */
import type { AlertButton } from 'react-native';
import { Alert as AlertRN, Platform } from 'react-native';

const alertPolyfill = {
  alert: (title: string, description: string, options: AlertButton[]) => {
    const result = window.confirm([title, description].filter(Boolean).join('\n'));

    if (result) {
      const confirmOption = options.find(({ style }) => style !== 'cancel');
      confirmOption?.onPress?.();
    }
    else {
      const cancelOption = options.find(({ style }) => style === 'cancel');
      cancelOption?.onPress?.();
    }
  },
};

const Alert = Platform.OS === 'web' ? alertPolyfill : AlertRN;

export default Alert;

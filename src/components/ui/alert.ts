/* eslint-disable no-alert */
import type { AlertButton } from 'react-native';
import { Alert as AlertRN } from 'react-native';
import { IS_WEB } from '@/lib/base';

const alertPolyfill = {
  alert: (title: string, description?: string, options?: AlertButton[]) => {
    const result = window.confirm([title, description ?? ''].filter(Boolean).join('\n'));

    if (result) {
      const confirmOption = options?.find(({ style }) => style !== 'cancel');
      confirmOption?.onPress?.();
    }
    else {
      const cancelOption = options?.find(({ style }) => style === 'cancel');
      cancelOption?.onPress?.();
    }
  },
};

const Alert = IS_WEB ? alertPolyfill : AlertRN;

export { Alert };

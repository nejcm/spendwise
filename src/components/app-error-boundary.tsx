import * as React from 'react';
import { NativeModules, View } from 'react-native';
import RNRestart from 'react-native-restart';

import { SolidButton } from '@/components/ui/solid-button';
import { Text } from '@/components/ui/text';
import { captureError } from '@/lib/analytics';
import { IS_WEB } from '@/lib/base';
import { translate } from '@/lib/i18n';

type Props = { children: React.ReactNode };
type State = { error: Error | null; restarting: boolean };

function restartApp() {
  if (IS_WEB) {
    window.location.reload();
    return;
  }
  if (__DEV__) {
    NativeModules.DevSettings?.reload?.();
  }
  else {
    RNRestart.restart();
  }
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, restarting: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, errorInfo.componentStack);
    captureError(error, {
      componentStack: errorInfo.componentStack ?? '',
    });
  }

  handleRestart = () => {
    this.setState({ restarting: true });
    restartApp();
  };

  render() {
    if (this.state.error) {
      return (
        <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-gray-900">
          <Text className="mb-2 text-center text-lg font-bold text-gray-900 dark:text-white">
            {translate('errors.title')}
          </Text>
          <Text className="mb-6 text-center text-gray-600 dark:text-gray-400">
            {translate('errors.description')}
          </Text>
          <SolidButton
            label={this.state.restarting ? 'Restarting…' : 'Restart app'}
            onPress={this.handleRestart}
            disabled={this.state.restarting}
          />
        </View>
      );
    }
    return this.props.children;
  }
}

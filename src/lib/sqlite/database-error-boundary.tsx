import * as React from 'react';
import { Text, View } from 'react-native';
import { OPFS_CLEAR_FLAG } from './opfs-cleaner';

export class DatabaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; clearing: boolean }
> {
  state = { error: null, clearing: false };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleClear = () => {
    this.setState({ clearing: true });
    // Phase 1: flag + reload so the Worker terminates and releases OPFS handles.
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(OPFS_CLEAR_FLAG, '1');
    }
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Database unavailable
          </Text>
          <Text style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>
            The database storage is in a broken state.
          </Text>
          <Text
            onPress={this.state.clearing ? undefined : this.handleClear}
            style={{
              color: this.state.clearing ? '#999' : '#007AFF',
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {this.state.clearing ? 'Restarting…' : 'Clear storage & restart'}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

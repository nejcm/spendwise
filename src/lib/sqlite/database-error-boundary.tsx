import * as React from 'react';
import { Text, View } from 'react-native';
import { SolidButton } from '@/components/ui/solid-button';
import { translate } from '@/lib/i18n';
import { OPFS_CLEAR_FLAG } from './opfs-cleaner';

function ErrorBody() {
  const [loading, setLoading] = React.useState(false);

  const handleClear = () => {
    setLoading(true);
    // Phase 1: flag + reload so the Worker terminates and releases OPFS handles.
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(OPFS_CLEAR_FLAG, '1');
    }
    window.location.reload();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text className="mb-2 text-xl font-bold">
        {translate('errors.database_unavailable')}
      </Text>
      <Text className="mb-6 text-center text-muted-foreground">
        {translate('errors.database_unavailable_desc')}
      </Text>
      <View className="items-center justify-center gap-2">
        <SolidButton
          onPress={handleClear}
          color="danger"
          className="min-w-40"
          label={translate('errors.db_clear_btn')}
          loading={loading}
        />
      </View>
    </View>
  );
}

export class DatabaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) return <ErrorBody />;
    return this.props.children;
  }
}

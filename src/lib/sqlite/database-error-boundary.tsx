import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Text, View } from 'react-native';
import { SolidButton } from '@/components/ui/solid-button';
import { captureError } from '@/lib/analytics';
import { translate } from '@/lib/i18n';
import { OPFS_CLEAR_FLAG } from './opfs-cleaner';

// Another tab holds the OPFS handle; wiping storage would destroy data that is fine.
function isLockedByOtherTab(error: Error) {
  return String(error?.message ?? error).includes('NoModificationAllowedError');
}

function ErrorBody({ error }: { error: Error }) {
  const [loading, setLoading] = React.useState(false);
  const locked = isLockedByOtherTab(error);

  const handleClear = () => {
    setLoading(true);
    // Phase 1: flag + reload so the Worker terminates and releases OPFS handles.
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(OPFS_CLEAR_FLAG, '1');
    }
    window.location.reload();
  };

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="mb-2 text-xl font-bold text-foreground">
        {translate('errors.database_unavailable')}
      </Text>
      <Text className="mb-6 text-center text-muted-foreground">
        {translate(locked ? 'errors.database_locked_desc' : 'errors.database_unavailable_desc')}
      </Text>
      <View className="items-center justify-center gap-2">
        {locked
          ? (
              <SolidButton
                onPress={() => window.location.reload()}
                className="min-w-40"
                label={translate('common.retry')}
              />
            )
          : (
              <SolidButton
                onPress={handleClear}
                color="danger"
                className="min-w-40"
                label={translate('errors.db_clear_btn')}
                loading={loading}
              />
            )}
      </View>
    </View>
  );
}

export class DatabaseErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[DatabaseErrorBoundary]', error);
    captureError(error, { boundary: 'DatabaseErrorBoundary' });
    // Ensure the splash screen is dismissed so the error UI is visible.
    SplashScreen.hideAsync().catch(() => {});
  }

  render() {
    if (this.state.error) return <ErrorBody error={this.state.error} />;
    return this.props.children;
  }
}

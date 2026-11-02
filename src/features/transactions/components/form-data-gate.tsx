import * as React from 'react';
import { View } from 'react-native';
import { EmptyState, SolidButton } from '@/components/ui';
import { useAccounts } from '@/features/accounts/api';
import { useCategories } from '@/features/categories/api';
import { translate } from '@/lib/i18n';

/** Mounts a transaction form only once accounts and categories have data, since it derives its defaults once. */
export function FormDataGate({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  const accounts = useAccounts();
  const categories = useCategories();
  if (accounts.data && categories.data) return children;
  if (!accounts.isError && !categories.isError) return null;

  const retry = () => {
    if (accounts.isError) void accounts.refetch();
    if (categories.isError) void categories.refetch();
  };
  return (
    <View className="flex-1 justify-center px-5">
      <EmptyState
        title={translate('errors.title')}
        body={translate('transactions.form.load_error')}
        actions={(
          <>
            <SolidButton
              color="primary"
              size="lg"
              label={translate('common.retry')}
              loading={accounts.isFetching || categories.isFetching}
              onPress={retry}
            />
            {onClose && <SolidButton color="secondary" size="lg" label={translate('common.close')} onPress={onClose} />}
          </>
        )}
      />
    </View>
  );
}

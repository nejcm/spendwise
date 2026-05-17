import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import ScreenHeader from '@/components/screen-header';
import { GhostButton, Text } from '@/components/ui';
import { useAccounts } from '@/features/accounts/api';
import { AccountForm } from '@/features/accounts/components/account-form';
import { centsToAmount } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';

export default function EditAccountRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: accounts = [], isLoading } = useAccounts();
  const account = React.useMemo(() => accounts.find((item) => item.id === id), [accounts, id]);
  const onBack = () => goBackOrFallback(router);

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={translate('accounts.edit')} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text>{translate('common.loading')}</Text>
        </View>
      </>
    );
  }

  if (!account) {
    return (
      <>
        <ScreenHeader title={translate('accounts.edit')} />
        <View className="flex-1 items-center justify-center gap-4 bg-background px-4">
          <Text className="text-center text-muted-foreground">{translate('accounts.not_found')}</Text>
          <GhostButton color="secondary" label={translate('common.back')} onPress={onBack} />
        </View>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title={translate('accounts.edit')} />
      <AccountForm
        accountId={account.id}
        initialData={{
          name: account.name,
          type: account.type,
          currency: account.currency,
          description: account.description,
          budget: account.budget != null ? String(centsToAmount(account.budget)) : null,
          icon: account.icon,
          color: account.color,
        }}
        onSuccess={onBack}
        onDeleteSuccess={onBack}
        onCancel={onBack}
      />
    </>
  );
}

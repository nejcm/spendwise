import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import ScreenHeader from '@/components/screen-header';
import { GhostButton, OverflowMenu, Text, TrashIcon } from '@/components/ui';
import { useAccounts, useArchiveAccountConfirmation } from '@/features/accounts/api';
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
  const archiveAccount = useArchiveAccountConfirmation(onBack);

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
      <ScreenHeader title={translate('accounts.edit')}>
        <OverflowMenu
          className="-mr-2 ml-auto"
          accessibilityLabel={translate('settings.more')}
          items={[
            {
              label: translate('common.delete'),
              onPress: () => archiveAccount.submit(account.id, account.name),
              className: 'text-danger-600',
              icon: <TrashIcon size={16} colorClassName="accent-danger-600" className="mr-2" />,
            },
          ]}
        />
      </ScreenHeader>
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
        onCancel={onBack}
      />
    </>
  );
}

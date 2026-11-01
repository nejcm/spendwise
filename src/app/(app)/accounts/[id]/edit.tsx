import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { Text } from '@/components/ui';
import { X } from '@/components/ui/icon';
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
  const archiveAccount = useArchiveAccountConfirmation(() => router.dismissTo('/accounts'));

  return (
    <>
      <View className="px-5 pt-2">
        <PageHeader
          title={translate('accounts.edit_title')}
          left={<HeaderButton icon={X} label={translate('common.close')} onPress={onBack} />}
        />
      </View>
      {isLoading
        ? <Text className="mt-10 text-center text-muted-foreground">{translate('common.loading')}</Text>
        : !account
            ? <Text className="mt-10 px-5 text-center text-muted-foreground">{translate('accounts.not_found')}</Text>
            : (
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
                  onArchive={() => archiveAccount.submit(account.id, account.name)}
                />
              )}
    </>
  );
}

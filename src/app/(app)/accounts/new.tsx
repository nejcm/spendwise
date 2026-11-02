import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { X } from '@/components/ui/icon';
import { AccountForm } from '@/features/accounts/components/account-form';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';

export default function NewAccountRoute() {
  const router = useRouter();
  const onBack = () => goBackOrFallback(router);

  return (
    <>
      <View className="px-5 pt-2">
        <PageHeader
          title={translate('accounts.add_title')}
          left={<HeaderButton icon={X} label={translate('common.close')} onPress={onBack} />}
        />
      </View>
      <AccountForm onSuccess={onBack} />
    </>
  );
}

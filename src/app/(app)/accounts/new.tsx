import { useRouter } from 'expo-router';
import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { AccountForm } from '@/features/accounts/components/account-form';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';

export default function NewAccountRoute() {
  const router = useRouter();
  const onBack = () => goBackOrFallback(router);

  return (
    <>
      <ScreenHeader title={translate('accounts.add')} />
      <AccountForm onSuccess={onBack} onCancel={onBack} />
    </>
  );
}

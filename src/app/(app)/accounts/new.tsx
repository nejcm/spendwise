import { useRouter } from 'expo-router';
import * as React from 'react';
import ScreenHeader from '@/components/screen-header';
import { AccountFormModal } from '@/features/accounts/components/account-form';
import { translate } from '@/lib/i18n';

export default function NewAccountRoute() {
  const router = useRouter();
  const onBack = () => router.back();

  return (
    <>
      <ScreenHeader title={translate('accounts.add')} />
      <AccountFormModal onSuccess={onBack} onCancel={onBack} />
    </>
  );
}

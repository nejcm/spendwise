import * as React from 'react';
import { useState } from 'react';

import { Button, Input, Select, Text, View } from '@/components/ui';
import { useCreateAccount } from '@/features/accounts/api';
import { useCurrency } from '@/lib/hooks/use-currency';
import { translate } from '@/lib/i18n';
import { CURRENCIES } from '../../currencies';
import IntroNav from '../Nav';

const ACCOUNT_TYPES = [
  { label: 'Cash', value: 'cash' },
  { label: 'Checking Account', value: 'checking' },
  { label: 'Savings Account', value: 'savings' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Other', value: 'other' },
];

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({ ...currency, label: currency.value, subtext: currency.name }));

export type SetupStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export default function SetupStep({ onBack, onNext }: SetupStepProps) {
  const [, setCurrency] = useCurrency();
  const createAccount = useCreateAccount();

  const [selectedCurrency, setSelectedCurrency] = useState<string | number>('EUR');
  const [accountName, setAccountName] = useState('Cash');
  const [accountType, setAccountType] = useState<string | number>('cash');
  const [openingBalance, setOpeningBalance] = useState('');

  const handleFinish = () => {
    setCurrency(String(selectedCurrency));
    createAccount.mutate(
      {
        name: accountName || 'Cash',
        type: String(accountType) as 'cash',
        currency: String(selectedCurrency),
        initial_balance: openingBalance || '0',
        icon: null,
        color: null,
      },
      { onSuccess: onNext },
    );
  };

  return (
    <>
      <View className="flex-1">
        <View className="bg-subtle p-6">
          <View className="flex-row items-center justify-center gap-3">
            <Text className="text-2xl font-bold tracking-tight text-black">{translate('onboarding.create_account')}</Text>
          </View>
        </View>
        <View className="px-6 pt-8">
          <IntroNav current={1} />
          <Select
            label={translate('onboarding.select_currency')}
            options={CURRENCY_OPTIONS}
            value={selectedCurrency}
            onSelect={setSelectedCurrency}
            containerClassName="mb-4"
          />

          <Input
            label={translate('onboarding.account_name')}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="e.g. Cash, Main Bank"
            containerClassName="mb-4"
          />

          <Select
            label={translate('onboarding.account_type')}
            options={ACCOUNT_TYPES}
            value={accountType}
            onSelect={setAccountType}
            containerClassName="mb-4"
          />

          <Input
            label={translate('onboarding.opening_balance')}
            value={openingBalance}
            onChangeText={setOpeningBalance}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>
        <View className="mt-auto w-full flex-row items-center gap-2 px-6 pb-8">
          <Button
            label={translate('common.back')}
            variant="ghost"
            size="lg"
            fullWidth={false}
            onPress={onBack}
            accessibilityLabel={translate('common.back')}
          />
          <Button
            label={translate('common.next')}
            onPress={handleFinish}
            loading={createAccount.isPending}
            className="flex-1"
            size="lg"
          />
        </View>
      </View>
    </>
  );
}

import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { useState } from 'react';

import { Button, FocusAwareStatusBar, Input, SafeAreaView, Select, Text, View } from '@/components/ui';
import { amountToCents } from '@/lib/format';
import { useCurrency } from '@/lib/hooks/use-currency';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';
import { translate } from '@/lib/i18n';
import { generateId } from '@/lib/sqlite';

const ACCOUNT_TYPES = [
  { label: 'Cash', value: 'cash' },
  { label: 'Checking Account', value: 'checking' },
  { label: 'Savings Account', value: 'savings' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Other', value: 'other' },
];

const CURRENCIES = [
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'CHF - Swiss Franc', value: 'CHF' },
];

export function OnboardingScreen() {
  const [step, setStep] = useState(0);

  return (
    <View className="flex h-full px-6">
      <FocusAwareStatusBar />
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && <SetupStep onBack={() => setStep(0)} />}
    </View>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <View className="flex-1 items-center justify-center">
        <Text className="mb-2 text-5xl font-bold text-primary-400">{translate('onboarding.title')}</Text>
        <Text className="mb-8 text-center text-lg text-neutral-500">{translate('onboarding.subtitle')}</Text>

        <View className="w-full gap-4">
          <FeatureRow text={translate('onboarding.feature1')} />
          <FeatureRow text={translate('onboarding.feature2')} />
          <FeatureRow text={translate('onboarding.feature3')} />
        </View>
      </View>
      <SafeAreaView className="w-full pb-4">
        <Button label={translate('onboarding.get_started')} onPress={onNext} />
      </SafeAreaView>
    </>
  );
}

function SetupStep({ onBack }: { onBack: () => void }) {
  const db = useSQLiteContext();
  const [_, setIsFirstTime] = useIsFirstTime();
  const [, setCurrency] = useCurrency();
  const router = useRouter();

  const [selectedCurrency, setSelectedCurrency] = useState<string | number>('EUR');
  const [accountName, setAccountName] = useState('Cash');
  const [accountType, setAccountType] = useState<string | number>('cash');
  const [openingBalance, setOpeningBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (saving)
      return;
    setSaving(true);

    try {
      setCurrency(String(selectedCurrency));

      const balanceCents = openingBalance ? amountToCents(Number.parseFloat(openingBalance) || 0) : 0;

      await db.runAsync('INSERT INTO accounts (id, name, type, currency, initial_balance) VALUES (?, ?, ?, ?, ?)', [
        generateId(),
        accountName || 'Cash',
        String(accountType),
        String(selectedCurrency),
        balanceCents,
      ]);

      setIsFirstTime(false);
      router.replace('/');
    }
    catch {
      setSaving(false);
    }
  };

  return (
    <>
      <View className="flex-1 pt-16">
        <Text className="mb-6 text-2xl font-bold">{translate('onboarding.create_account')}</Text>

        <Select
          label={translate('onboarding.select_currency')}
          options={CURRENCIES}
          value={selectedCurrency}
          onSelect={setSelectedCurrency}
        />

        <Input
          label={translate('onboarding.account_name')}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="e.g. Cash, Main Bank"
        />

        <Select
          label={translate('onboarding.account_type')}
          options={ACCOUNT_TYPES}
          value={accountType}
          onSelect={setAccountType}
        />

        <Input
          label={translate('onboarding.opening_balance')}
          value={openingBalance}
          onChangeText={setOpeningBalance}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
      </View>
      <SafeAreaView className="w-full gap-3 pb-4">
        <Button label={translate('onboarding.finish_setup')} onPress={handleFinish} loading={saving} />
        <Button label={translate('common.back')} variant="ghost" onPress={onBack} />
      </SafeAreaView>
    </>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
      <View className="size-2 rounded-full bg-primary-400" />
      <Text className="flex-1 text-base">{text}</Text>
    </View>
  );
}

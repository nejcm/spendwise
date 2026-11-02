import type { TextInput } from 'react-native';
import type { AccountType, FirstAccountData } from '@/features/accounts/types';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';

import { Card, Chip, FlagCircle, FocusArea, Input, Pressable, SolidButton, Text, useModalSheet, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { useSetupFirstAccount } from '@/features/accounts/hooks';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES } from '@/features/accounts/types';
import { CurrencySheet } from '@/features/currencies/components/currency-sheet';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import { useAppStore } from '@/lib/store/store';
import OnboardingLayout from '../layout';

export type AccountStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export default function AccountStep({ onBack, onNext }: AccountStepProps) {
  const preferredCurrency = useAppStore.use.currency();
  const [name, setName] = React.useState(() => translate('onboarding.account_default_name'));
  const [icon, setIcon] = React.useState('💳');
  const [type, setType] = React.useState<AccountType>('checking');
  const [currency, setCurrency] = React.useState<CurrencyKey>(preferredCurrency);
  const [balance, setBalance] = React.useState('');
  const isBalanceValid = !balance.trim() || toNumber(balance) !== undefined;
  const setupFirstAccount = useSetupFirstAccount();
  const currencyModal = useModalSheet();
  const nameRef = React.useRef<TextInput>(null);
  const balanceRef = React.useRef<TextInput>(null);

  const submit = (data: FirstAccountData | null) => {
    setupFirstAccount.mutate({ data, preferredCurrency }, { onSuccess: onNext });
  };

  return (
    <OnboardingLayout
      step={3}
      title={translate('onboarding.account_title')}
      subtitle={translate('onboarding.account_subtitle')}
      onBack={onBack}
      footer={(
        <>
          <SolidButton
            color="primary"
            size="lg"
            fullWidth
            label={translate('onboarding.add_account')}
            disabled={!name.trim() || !isBalanceValid || setupFirstAccount.isPending}
            onPress={() => submit({ name: name.trim(), icon: icon.trim() || null, type, currency, opening_balance: balance.trim() || null })}
          />
          <GhostButton
            color="secondary"
            size="md"
            textClassName="text-foreground-2"
            label={translate('onboarding.skip')}
            disabled={setupFirstAccount.isPending}
            onPress={() => submit(null)}
          />
        </>
      )}
    >
      <Card className="mt-[26px] flex-row items-center gap-3 p-3">
        <Input
          value={icon}
          onChangeText={setIcon}
          accessibilityLabel={translate('onboarding.account_emoji')}
          containerClassName="shrink-0"
          className="size-13 rounded-2xl border-0 bg-accent-soft px-0 text-center text-2xl"
        />
        <FocusArea target={nameRef} className="flex-1 justify-center self-stretch">
          <Text className="text-xs text-muted-foreground">{translate('onboarding.account_name')}</Text>
          <Input
            ref={nameRef}
            value={name}
            onChangeText={setName}
            accessibilityLabel={translate('onboarding.account_name')}
            className="h-auto rounded-none border-0 bg-transparent px-0 text-[17px] font-medium"
          />
        </FocusArea>
      </Card>

      <View accessibilityRole="radiogroup" accessibilityLabel={translate('accounts.type')} className="flex-row flex-wrap gap-2 pt-3.5">
        {ACCOUNT_TYPES.map((value) => (
          <Chip
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === type }}
            accessibilityLabel={ACCOUNT_TYPE_LABELS[value]}
            label={ACCOUNT_TYPE_LABELS[value]}
            selected={value === type}
            onPress={() => setType(value)}
          />
        ))}
      </View>

      <Card className="mt-4.5 flex-row items-center justify-between gap-3 p-0">
        <FocusArea target={balanceRef} className="flex-1 py-4 pl-4">
          <Text className="text-meta text-muted-foreground">{translate('onboarding.account_balance')}</Text>
          <Input
            ref={balanceRef}
            value={balance}
            onChangeText={setBalance}
            placeholder="0.00"
            keyboardType="numbers-and-punctuation"
            accessibilityLabel={translate('onboarding.account_balance')}
            className="h-auto rounded-none border-0 bg-transparent px-0 text-[17px] font-medium"
          />
        </FocusArea>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('common.currency')}
          onPress={currencyModal.present}
          className="mr-4 h-7.5 flex-row items-center gap-1.5 rounded-full bg-card-2 pr-2.5 pl-1"
        >
          <FlagCircle currency={currency} size={22} />
          <Text className="text-meta font-semibold">{currency}</Text>
        </Pressable>
      </Card>

      <CurrencySheet ref={currencyModal.ref} value={currency} onSelect={setCurrency} />
    </OnboardingLayout>
  );
}

import type { OptionType } from '@/components/ui';
import type { AccountType, FirstAccountData } from '@/features/accounts/types';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';

import { Card, Chip, FlagCircle, Input, Options, Pressable, SolidButton, Text, useModalSheet, View } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { useSetupFirstAccount } from '@/features/accounts/hooks';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES } from '@/features/accounts/types';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { translate } from '@/lib/i18n';
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
  const setupFirstAccount = useSetupFirstAccount();
  const currencyModal = useModalSheet();

  const submit = (data: FirstAccountData | null) => {
    setupFirstAccount.mutate({ data, preferredCurrency }, { onSuccess: onNext });
  };

  const onSelectCurrency = (option: OptionType) => {
    currencyModal.close();
    setCurrency(option.value as CurrencyKey);
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
            disabled={!name.trim() || setupFirstAccount.isPending}
            onPress={() => submit({ name: name.trim(), icon: icon.trim() || null, type, currency })}
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
          className="size-[52px] rounded-2xl border-0 bg-accent-soft px-0 text-center text-2xl"
        />
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground">{translate('onboarding.account_name')}</Text>
          <Input
            value={name}
            onChangeText={setName}
            accessibilityLabel={translate('onboarding.account_name')}
            className="h-auto rounded-none border-0 bg-transparent px-0 text-[17px] font-medium"
          />
        </View>
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

      <Card className="mt-[18px] flex-row items-center justify-between p-4">
        <Text className="text-meta text-muted-foreground">{translate('common.currency')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={translate('common.currency')}
          onPress={currencyModal.present}
          className="h-[30px] flex-row items-center gap-1.5 rounded-full bg-card-2 pr-2.5 pl-1"
        >
          <FlagCircle currency={currency} size={22} />
          <Text className="text-meta font-semibold">{currency}</Text>
        </Pressable>
      </Card>

      <Options ref={currencyModal.ref} options={CURRENCY_OPTIONS} onSelect={onSelectCurrency} value={currency} searchEnabled />
    </OnboardingLayout>
  );
}

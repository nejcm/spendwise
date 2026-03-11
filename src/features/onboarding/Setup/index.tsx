import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import * as z from 'zod';

import { Button, Input, Select, Text, View } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useCreateAccount } from '@/features/accounts/api';
import { translate } from '@/lib/i18n';
import { setCurrency } from '@/lib/store';
import { CURRENCIES } from '../../currencies';
import IntroNav from '../Nav';

const schema = z.object({
  currency: z.string().min(1, 'Currency required'),
  account_name: z.string().min(1, 'Account name required'),
  account_type: z.string().min(1, 'Account type required'),
  opening_balance: z.string(),
});

const ACCOUNT_TYPES = [
  { label: 'Cash', value: 'cash' },
  { label: 'Checking Account', value: 'checking' },
  { label: 'Savings Account', value: 'savings' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Other', value: 'other' },
];

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({ ...currency, label: currency.value, subtext: currency.name }));

const defaultValues = {
  currency: 'EUR',
  account_name: 'Cash',
  account_type: 'cash',
  opening_balance: '',
};

export type SetupStepProps = {
  onBack: () => void;
  onNext: () => void;
};

export default function SetupStep({ onBack, onNext }: SetupStepProps) {
  const createAccount = useCreateAccount();

  const form = useForm({
    defaultValues,
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      setCurrency(value.currency);
      onNext();
    },
  });

  return (
    <>
      <View className="flex-1">
        <View className="bg-subtle p-6">
          <View className="flex-row items-center justify-center gap-3">
            <Text className="text-2xl font-bold tracking-tight text-black dark:text-black">{translate('onboarding.create_account')}</Text>
          </View>
        </View>
        <View className="px-6 pt-8">
          <IntroNav current={1} />

          <form.Field
            name="currency"
            children={(field) => (
              <Select
                label={translate('onboarding.select_currency')}
                options={CURRENCY_OPTIONS}
                value={field.state.value}
                onSelect={(v) => field.handleChange(String(v))}
                containerClassName="mb-4"
              />
            )}
          />

          <form.Field
            name="account_name"
            children={(field) => (
              <Input
                label={translate('onboarding.account_name')}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder="e.g. Cash, Main Bank"
                containerClassName="mb-4"
                error={getFieldError(field)}
              />
            )}
          />

          <form.Field
            name="account_type"
            children={(field) => (
              <Select
                label={translate('onboarding.account_type')}
                options={ACCOUNT_TYPES}
                value={field.state.value}
                onSelect={(v) => field.handleChange(String(v))}
                containerClassName="mb-4"
              />
            )}
          />

          <form.Field
            name="opening_balance"
            children={(field) => (
              <Input
                label={translate('onboarding.opening_balance')}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
                error={getFieldError(field)}
              />
            )}
          />
        </View>

        <form.Subscribe
          selector={(state) => [state.isSubmitting]}
          children={([isSubmitting]) => (
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
                onPress={form.handleSubmit}
                loading={(isSubmitting as boolean) || createAccount.isPending}
                className="flex-1"
                size="lg"
              />
            </View>
          )}
        />
      </View>
    </>
  );
}

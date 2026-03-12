import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as z from 'zod';

import { Button, FocusAwareStatusBar, Input, ScrollView, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { todayISO } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAccounts, useCreateTransfer } from './api';

const schema = z.object({
  from_id: z.string().min(1, 'From account required'),
  to_id: z.string().min(1, 'To account required'),
  amount: z.string().min(1, 'Amount required'),
  note: z.string(),
});

const defaultValues = {
  from_id: null as string | null,
  to_id: null as string | null,
  amount: '',
  note: '',
};

const validators = {
  onChange: schema,
};

export function TransferScreen() {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { mutate: createTransfer, isPending } = useCreateTransfer();

  const form = useForm({
    defaultValues,
    validators,
    onSubmit: async ({ value }) => {
      if (!value.from_id || !value.to_id) return;
      if (value.from_id === value.to_id) {
        Alert.alert('Error', 'Cannot transfer to the same account');
        return;
      }
      createTransfer(
        { fromAccountId: value.from_id, toAccountId: value.to_id, amount: value.amount, date: todayISO(), note: value.note },
        { onSuccess: () => router.back() },
      );
    },
  });

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <form.Field
          name="from_id"
          children={(field) => (
            <>
              <Text className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {translate('accounts.from_account')}
              </Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {accounts.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => field.handleChange(a.id)}
                    className={`rounded-full px-3 py-1.5 ${field.state.value === a.id ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                  >
                    <Text className={`text-sm ${field.state.value === a.id ? 'font-medium text-white' : ''}`}>
                      {a.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        />

        <form.Field
          name="to_id"
          children={(field) => (
            <>
              <Text className="mb-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                {translate('accounts.to_account')}
              </Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {accounts.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => field.handleChange(a.id)}
                    className={`rounded-full px-3 py-1.5 ${field.state.value === a.id ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                  >
                    <Text className={`text-sm ${field.state.value === a.id ? 'font-medium text-white' : ''}`}>
                      {a.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        />

        <form.Field
          name="amount"
          children={(field) => (
            <Input
              label={translate('transactions.amount')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChangeText={field.handleChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={getFieldError(field)}
            />
          )}
        />

        <View className="mt-4">
          <form.Field
            name="note"
            children={(field) => (
              <Input
                label={translate('transactions.note')}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder={translate('accounts.transfer_note')}
                error={getFieldError(field)}
              />
            )}
          />
        </View>

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.from_id, state.values.to_id, state.values.amount]}
          children={([isSubmitting, fromId, toId, amount]) => (
            <View className="mt-6 flex-row gap-3">
              <Button
                label={translate('common.cancel')}
                variant="outline"
                onPress={() => router.back()}
                className="flex-1"
              />
              <Button
                label={translate('accounts.transfer')}
                onPress={form.handleSubmit}
                disabled={!fromId || !toId || !(amount as string) || isPending}
                loading={(isSubmitting as boolean) || isPending}
                className="flex-1"
              />
            </View>
          )}
        />
      </ScrollView>
    </View>
  );
}

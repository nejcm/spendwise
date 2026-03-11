import type { AccountFormData, AccountType } from '../types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import * as z from 'zod';
import { Button, Input, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { translate } from '@/lib/i18n';
import { ACCOUNT_COLORS, ACCOUNT_TYPE_LABELS } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['cash', 'checking', 'savings', 'credit_card', 'investment', 'other']),
  initial_balance: z.string().regex(/^\d*\.?\d*$/, 'Invalid amount'),
  color: z.string(),
});

const ACCOUNT_TYPES: AccountType[] = ['cash', 'checking', 'savings', 'credit_card', 'investment', 'other'];

export type AccountFormProps = {
  initialData?: AccountFormData;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const defaultValues: AccountFormData = {
  name: '',
  type: 'checking',
  initial_balance: '0',
  color: ACCOUNT_COLORS[0],
  currency: 'USD',
  icon: null,
};

export function AccountForm({ initialData, onSubmit, onCancel, isSubmitting }: AccountFormProps) {
  const form = useForm({
    defaultValues: { ...defaultValues, ...initialData },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit({ ...value, currency: 'EUR', icon: null });
    },
  });

  return (
    <View className="gap-4">
      <form.Field
        name="name"
        children={(field) => (
          <Input
            label={translate('accounts.name')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder={translate('accounts.name_placeholder')}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="type"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {translate('accounts.type')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => field.handleChange(t)}
                  className={`rounded-full px-3 py-1.5 ${field.state.value === t ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                >
                  <Text className={`text-sm ${field.state.value === t ? 'font-semibold text-white' : ''}`}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      <form.Field
        name="initial_balance"
        children={(field) => (
          <Input
            label={translate('accounts.opening_balance')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            keyboardType="decimal-pad"
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="color"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {translate('accounts.color')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCOUNT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => field.handleChange(c)}
                  className={`size-8 rounded-full ${field.state.value === c ? 'border-2 border-primary-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </View>
          </View>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.values.name]}
        children={([isSubmittingForm, name]) => (
          <View className="mt-2 flex-row gap-3">
            <Button
              label={translate('common.cancel')}
              variant="outline"
              onPress={onCancel}
              className="flex-1"
            />
            <Button
              label={translate('common.save')}
              onPress={form.handleSubmit}
              disabled={!(name as string).trim() || isSubmitting}
              loading={(isSubmittingForm as boolean) || isSubmitting}
              className="flex-1"
            />
          </View>
        )}
      />
    </View>
  );
}

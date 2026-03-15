import type { AccountFormData, AccountType } from '../types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import * as z from 'zod';
import { Input, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { getFieldError } from '@/components/ui/form-utils';
import { OutlineButton } from '@/components/ui/outline-button';
import { translate } from '@/lib/i18n';
import { COLOR_OPTIONS } from '@/lib/theme/colors';
import { useArchiveAccount, useCreateAccount, useUpdateAccount } from '../api';
import { ACCOUNT_TYPE_LABELS } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['cash', 'checking', 'savings', 'credit_card', 'investment', 'other']),
  color: z.string(),
});

const ACCOUNT_TYPES: AccountType[] = ['cash', 'checking', 'savings', 'credit_card', 'investment', 'other'];

export type AccountFormProps = {
  initialData?: AccountFormData;
  accountId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const defaultValues: AccountFormData = {
  name: '',
  type: 'checking',
  description: null,
  color: COLOR_OPTIONS[0].value,
  currency: 'USD',
  icon: null,
};

export function AccountForm({ initialData, accountId, onSuccess, onCancel }: AccountFormProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();
  const isEditMode = Boolean(accountId);

  const form = useForm({
    defaultValues: { ...defaultValues, ...initialData },
    validators: {
      onChange: schema as any,
    },
    onSubmit: async ({ value }) => {
      const data = {
        ...value,
        currency: value.currency ?? defaultValues.currency,
        icon: value.icon ?? defaultValues.icon,
      };

      if (accountId) {
        await updateAccount.mutateAsync({ id: accountId, data });
      }
      else {
        await createAccount.mutateAsync(data);
      }

      onSuccess?.();
    },
  });

  const handleDelete = React.useCallback(() => {
    if (!accountId) return;

    Alert.alert(
      translate('common.delete'),
      translate('accounts.delete_confirm', { name: initialData?.name ?? '' }),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await archiveAccount.mutateAsync(accountId);
            onSuccess?.();
          },
        },
      ],
    );
  }, [accountId, archiveAccount, initialData?.name, onSuccess]);

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
            <Text className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              {translate('accounts.type')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => field.handleChange(t)}
                  className={`rounded-full px-3 py-1.5 ${field.state.value === t ? 'bg-primary-400' : 'bg-gray-100 dark:bg-gray-700'}`}
                >
                  <Text className={`text-sm ${field.state.value === t ? 'font-medium text-white' : ''}`}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      />

      <form.Field
        name="color"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              {translate('accounts.color')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => field.handleChange(c.value)}
                  className={`size-8 rounded-full ${field.state.value === c.value ? 'border-2 border-primary-400' : ''}`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </View>
          </View>
        )}
      />

      {isEditMode && (
        <SolidButton
          label={translate('common.delete')}
          color="danger"
          onPress={handleDelete}
          className="mt-4 w-full"
          loading={archiveAccount.isPending}
        />
      )}

      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.values.name]}
        children={([isSubmittingForm, name]) => {
          const isMutating = createAccount.isPending || updateAccount.isPending;

          return (
            <View className={`flex-row gap-3 ${isEditMode ? 'mt-0' : 'mt-2'}`}>
              <OutlineButton
                label={translate('common.cancel')}
                onPress={onCancel}
                className="flex-1"
              />
              <SolidButton
                label={translate('common.save')}
                onPress={form.handleSubmit}
                disabled={!(name as string).trim() || isMutating || archiveAccount.isPending}
                loading={(isSubmittingForm as boolean) || isMutating}
                className="flex-1"
              />
            </View>
          );
        }}
      />
    </View>
  );
}

import type { AccountFormData, AccountType } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';
import ColorSelector from '@/components/color-selector';
import { Input, Select, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { getFieldError } from '@/components/ui/form-utils';
import { GhostButton } from '@/components/ui/ghost-button';
import { OutlineButton } from '@/components/ui/outline-button';
import { CURRENCY_OPTIONS, CURRENCY_VALUES } from '@/features/currencies';
import { mergeCurrencyArrays } from '@/features/currencies/helpers';
import { translate } from '@/lib/i18n';
import { addLastUsedCurrency, selectAccountFormPrefs, selectLastUsedCurrencies, setAccountFormPrefs, useAppStore } from '@/lib/store';
import { getRandomColor } from '@/lib/theme/colors';
import { useArchiveAccount, useCreateAccount, useUpdateAccount } from '../api';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES } from '../types';

const schema = z.object({
  name: z.string().min(1, translate('accounts.name_required')),
  type: z.enum(ACCOUNT_TYPES as readonly AccountType[]),
  color: z.string().nullable(),
  currency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
  description: z.string().nullable(),
  icon: z.emoji().nullable(),
  budget: z.string().nullable(),
});

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
  color: 'bg-sky-600',
  currency: 'USD',
  icon: null,
  budget: null,
};

export function AccountForm({ initialData, accountId, onSuccess, onCancel }: AccountFormProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();
  const isEditMode = Boolean(accountId);
  const accountFormPrefs = useAppStore(selectAccountFormPrefs);
  const lastUsedCurrencies = useAppStore(selectLastUsedCurrencies);
  const orderedCurrencies = React.useMemo(() => mergeCurrencyArrays(lastUsedCurrencies, CURRENCY_OPTIONS), [lastUsedCurrencies]);

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      color: getRandomColor(),
      type: accountFormPrefs?.type || defaultValues.type,
      currency: accountFormPrefs?.currency || defaultValues.currency,
      ...initialData,
    } as z.infer<typeof schema>,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const data: AccountFormData = {
        name: value.name,
        type: value.type,
        currency: value.currency,
        description: value.description || null,
        icon: value.icon || null,
        color: value.color || null,
        budget: value.budget?.trim() ? value.budget : null,
      };
      if (accountId) {
        await updateAccount.mutateAsync({ id: accountId, data });
      }
      else {
        await createAccount.mutateAsync(data);
      }
      setAccountFormPrefs({
        type: data.type,
        currency: data.currency,
      });
      addLastUsedCurrency(data.currency);
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
      <View className="mb-2 flex-row items-center gap-3">
        <form.Field
          name="color"
          children={(field) => (
            <ColorSelector
              value={field.state.value ?? 'bg-sky-600'}
              onSelect={(value) => field.handleChange(String(value))}
              stackBehavior="push"
              size="xl"
            />
          )}
        />
        <form.Field
          name="icon"
          children={(field) => (
            <Input
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChangeText={(v) => field.handleChange(v.trim() || null)}
              placeholder={translate('accounts.icon_placeholder')}
              containerClassName="flex-1"
              className="text-3xl"
              size="xl"
            />
          )}
        />
      </View>

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
        name="description"
        children={(field) => (
          <Input
            label={translate('common.description')}
            value={field.state.value ?? ''}
            onBlur={field.handleBlur}
            onChangeText={(v) => field.handleChange(v.trim() || null)}
            placeholder={translate('accounts.description_placeholder')}
            error={getFieldError(field)}
          />
        )}
      />
      <form.Field
        name="type"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium">{translate('accounts.type')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <SolidButton
                  key={t}
                  size="sm"
                  className="items-center rounded-3xl"
                  color={field.state.value === t ? 'primary' : 'secondary'}
                  label={ACCOUNT_TYPE_LABELS[t]}
                  onPress={() => field.handleChange(t)}
                />
              ))}
            </View>
          </View>
        )}
      />
      <form.Field
        name="currency"
        children={(field) => (
          <View>
            <Text className="mb-2 text-sm font-medium">{translate('settings.default_currency')}</Text>
            <Select
              value={field.state.value}
              options={orderedCurrencies}
              searchEnabled
              onSelect={(value) => {
                if (!value) return;
                field.handleChange(String(value) as CurrencyKey);
              }}
              showChevron
              stackBehavior="push"
            />
          </View>
        )}
      />
      <form.Field
        name="budget"
        children={(field) => (
          <Input
            label={translate('accounts.budget')}
            value={field.state.value ?? ''}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            placeholder="0"
            keyboardType="decimal-pad"
            className="mb-6"
            error={getFieldError(field)}
          />
        )}
      />
      {isEditMode && (
        <View className="mb-2 flex-row justify-center">
          <OutlineButton
            label={translate('common.delete')}
            color="danger"
            onPress={handleDelete}
            className="min-w-24 rounded-full"
            size="sm"
          />
        </View>
      )}
      <form.Subscribe
        selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
        children={(state) => (
          <View className="flex-row items-center gap-3">
            {onCancel && <GhostButton label={translate('common.cancel')} onPress={onCancel} color="secondary" />}
            <SolidButton
              label={translate('common.save')}
              onPress={form.handleSubmit}
              loading={(!!state.isSubmitting) || createAccount.isPending || updateAccount.isPending || archiveAccount.isPending}
              disabled={!schema.safeParse(state.values).success}
              className="flex-1"
            />
          </View>
        )}
      />
    </View>
  );
}

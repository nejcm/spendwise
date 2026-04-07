import type { AccountFormData, AccountType } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';
import ColorSelector from '@/components/color-selector';
import { Input, OutlineButton, Select, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { GhostButton } from '@/components/ui/ghost-button';
import { CURRENCY_VALUES } from '@/features/currencies';
import { mergeCurrencyArrays } from '@/features/currencies/helpers';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { translate } from '@/lib/i18n';
import { addLastUsedCurrency, selectAccountFormPrefs, selectLastUsedCurrencies, setAccountFormPrefs, useAppStore } from '@/lib/store';
import { getRandomColor } from '@/lib/theme/colors';
import { useArchiveAccountConfirmation, useCreateAccount, useUpdateAccount } from '../api';
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
  onDeleteSuccess?: () => void;
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

export function AccountForm({ initialData, accountId, onSuccess, onDeleteSuccess, onCancel }: AccountFormProps) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccountConfirmation(onDeleteSuccess);
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

  return (
    <View className="flex-1 gap-4">
      <View className="mb-2 flex-row items-center justify-center gap-3">
        <form.Field
          name="color"
          children={(field) => (
            <ColorSelector
              value={field.state.value ?? 'bg-sky-600'}
              onSelect={(value) => field.handleChange(String(value))}
              stackBehavior="push"
              size="2xl"
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
              containerClassName="w-[100]"
              className="border-0 px-0.5 text-center text-3xl"
              size="2xl"
            />
          )}
        />
      </View>

      <form.Field
        name="name"
        children={(field) => (
          <Input
            size="lg"
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
            size="lg"
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

      <View className="mb-6 flex-row gap-2">
        <form.Field
          name="currency"
          children={(field) => (
            <Select
              value={field.state.value}
              options={orderedCurrencies}
              searchEnabled
              size="lg"
              onSelect={(value) => {
                if (!value) return;
                field.handleChange(String(value) as CurrencyKey);
              }}
              showChevron={false}
              stackBehavior="push"
              containerClassName="w-[100]"
            />
          )}
        />
        <form.Field
          name="budget"
          children={(field) => (
            <Input
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              size="lg"
              onChangeText={field.handleChange}
              placeholder={translate('accounts.budget_placeholder')}
              keyboardType="decimal-pad"
              containerClassName="flex-1"
              error={getFieldError(field)}
            />
          )}
        />
      </View>

      <form.Subscribe
        selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
        children={(state) => (
          <View className="mt-auto flex-row items-center gap-3">
            {onCancel && <OutlineButton label={translate('common.cancel')} onPress={onCancel} color="secondary" />}
            <SolidButton
              label={translate('common.save')}
              onPress={form.handleSubmit}
              loading={(!!state.isSubmitting) || createAccount.isPending || updateAccount.isPending || archiveAccount.mutation.isPending}
              disabled={!schema.safeParse(state.values).success}
              className="flex-1"
            />
          </View>
        )}
      />
      {!!accountId && (
        <View className="mb-2 flex-row justify-center">
          <GhostButton
            label={translate('common.delete')}
            color="danger"
            fullWidth
            onPress={() => archiveAccount.submit(accountId, initialData?.name)}
          />
        </View>
      )}
    </View>
  );
}

import type { AccountFormData, AccountType } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { Keyboard, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
import ColorSelector, { DEFAULT_COLOR } from '@/components/color-selector';
import { Card, Chip, FlagCircle, GhostButton, Input, ListRow, SolidButton, Text, useModalSheet } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { ChevronRight } from '@/components/ui/icon';
import { CURRENCY_VALUES } from '@/features/currencies';
import { CurrencySheet } from '@/features/currencies/components/currency-sheet';
import { translate } from '@/lib/i18n';
import { toNumber } from '@/lib/number';
import { addLastUsedCurrency, selectAccountFormPrefs, setAccountFormPrefs, useAppStore } from '@/lib/store/store';
import { getRandomColor, hexWithOpacity } from '@/lib/theme/colors';
import { useCreateAccount, useUpdateAccount } from '../api';
import { ACCOUNT_TYPE_LABELS, ACCOUNT_TYPES } from '../types';

const schema = z.object({
  name: z.string().min(1, translate('accounts.name_required')),
  type: z.enum(ACCOUNT_TYPES as readonly AccountType[]),
  color: z.string().nullable(),
  currency: z.enum(CURRENCY_VALUES as CurrencyKey[]),
  description: z.string().nullable(),
  icon: z.emoji().nullable(),
  budget: z.string().nullable(),
  opening_balance: z.string().nullable().refine((v) => !v?.trim() || toNumber(v) !== undefined, translate('accounts.opening_balance_invalid')),
});

const defaultValues: AccountFormData = {
  name: '',
  type: 'checking',
  description: null,
  color: 'bg-sky-600',
  currency: 'USD',
  icon: null,
  budget: null,
  opening_balance: null,
};

const fieldInputClassName = 'rounded-tile border-0 bg-card';
const rowInputClassName = 'h-auto min-w-[120px] rounded-none border-0 bg-transparent px-0 text-right text-base font-medium';

function useAccountForm(
  initialData?: AccountFormData,
  accountId?: string,
  onSuccess?: () => void,
) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const accountFormPrefs = useAppStore(selectAccountFormPrefs);

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
        description: value.description?.trim() || null,
        icon: value.icon || null,
        color: value.color || null,
        budget: value.budget?.trim() ? value.budget : null,
        opening_balance: value.opening_balance?.trim() || null,
      };
      if (accountId) {
        await updateAccount.mutateAsync({ id: accountId, data });
      }
      else {
        await createAccount.mutateAsync(data);
      }
      setAccountFormPrefs({ type: data.type, currency: data.currency });
      addLastUsedCurrency(data.currency);
      onSuccess?.();
    },
  });

  return { form, isLoading: createAccount.isPending || updateAccount.isPending };
}

type AccountFormApi = ReturnType<typeof useAccountForm>['form'];

function FieldLabel({ children }: { children: string }) {
  return <Text className="px-1 pt-4 pb-1.5 text-meta font-medium text-muted-foreground">{children}</Text>;
}

function IdentityCard({ form }: { form: AccountFormApi }) {
  return (
    <form.Subscribe
      selector={(s) => s.values.color}
      children={(color) => (
        <Card className="flex-row items-center gap-4 p-4">
          <form.Field
            name="icon"
            children={(field) => (
              <Input
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChangeText={(v) => {
                  const icon = v.trim() || null;
                  field.handleChange(icon);
                  if (icon) Keyboard.dismiss();
                }}
                placeholder={translate('accounts.icon_placeholder')}
                accessibilityLabel={translate('accounts.icon_placeholder')}
                containerClassName="shrink-0"
                className="size-16 rounded-card border-0 px-0 text-center text-3xl"
                style={{ backgroundColor: hexWithOpacity(color || DEFAULT_COLOR, 26) }}
              />
            )}
          />
          <View className="min-w-0 flex-1 gap-1">
            <Text className="text-meta text-muted-foreground">{translate('accounts.tap_emoji')}</Text>
            <form.Field
              name="color"
              children={(field) => (
                <ColorSelector
                  value={field.state.value ?? DEFAULT_COLOR}
                  onSelect={(value) => field.handleChange(String(value))}
                  stackBehavior="push"
                  size="sm"
                  inputClassName="h-auto self-start"
                  renderSelectedItem={(item) => (
                    <View className="flex-row items-center gap-2 py-1">
                      <View className="size-5 rounded-full border border-border" style={{ backgroundColor: String(item?.value || field.state.value || DEFAULT_COLOR) }} />
                      <Text className="text-row font-medium">{translate('accounts.color')}</Text>
                      <ChevronRight size={16} colorClassName="accent-muted-foreground" />
                    </View>
                  )}
                />
              )}
            />
          </View>
        </Card>
      )}
    />
  );
}

function DetailsCard({ form, isCreate }: { form: AccountFormApi; isCreate: boolean }) {
  const preferredCurrency = useAppStore.use.currency();
  const currencyModal = useModalSheet();

  return (
    <form.Field
      name="currency"
      children={(currencyField) => (
        <>
          <Card className="mt-5 px-[18px]">
            <ListRow
              className="border-b border-border"
              chevron={isCreate}
              onPress={isCreate ? currencyModal.present : undefined}
              title={translate('common.currency')}
              trailing={(
                <View className="flex-row items-center gap-2">
                  <FlagCircle currency={currencyField.state.value} size={22} />
                  <Text className="text-row font-medium">{currencyField.state.value}</Text>
                </View>
              )}
            />
            {isCreate && (
              <form.Field
                name="opening_balance"
                children={(field) => (
                  <ListRow
                    className="border-b border-border"
                    title={translate('accounts.opening_balance')}
                    meta={getFieldError(field)}
                    trailing={(
                      <Input
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChangeText={field.handleChange}
                        placeholder="0.00"
                        accessibilityLabel={translate('accounts.opening_balance')}
                        keyboardType="numbers-and-punctuation"
                        className={rowInputClassName}
                      />
                    )}
                  />
                )}
              />
            )}
            <form.Field
              name="budget"
              children={(field) => (
                <ListRow
                  title={translate('accounts.budget')}
                  meta={translate('accounts.budget_hint', { currency: preferredCurrency })}
                  trailing={(
                    <Input
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChangeText={field.handleChange}
                      placeholder={translate('common.optional')}
                      accessibilityLabel={translate('accounts.budget')}
                      keyboardType="decimal-pad"
                      className={rowInputClassName}
                    />
                  )}
                />
              )}
            />
          </Card>
          {isCreate && (
            <CurrencySheet ref={currencyModal.ref} value={currencyField.state.value} onSelect={currencyField.handleChange} />
          )}
        </>
      )}
    />
  );
}

export type AccountFormProps = {
  initialData?: AccountFormData;
  accountId?: string;
  onSuccess?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
};

export function AccountForm({ initialData, accountId, onSuccess, onArchive, onDelete }: AccountFormProps) {
  const { form, isLoading } = useAccountForm(initialData, accountId, onSuccess);
  const insets = useSafeAreaInsets();
  const isCreate = !accountId;

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 88 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <IdentityCard form={form} />

        <form.Field
          name="name"
          children={(field) => (
            <>
              <FieldLabel>{translate('accounts.name')}</FieldLabel>
              <Input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder={translate('accounts.name_placeholder')}
                accessibilityLabel={translate('accounts.name')}
                className={fieldInputClassName}
                error={getFieldError(field)}
              />
            </>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <>
              <FieldLabel>{translate('common.description')}</FieldLabel>
              <Input
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder={translate('common.optional')}
                accessibilityLabel={translate('common.description')}
                className={fieldInputClassName}
                error={getFieldError(field)}
              />
            </>
          )}
        />

        <form.Field
          name="type"
          children={(field) => (
            <>
              <FieldLabel>{translate('accounts.type')}</FieldLabel>
              <View accessibilityRole="radiogroup" accessibilityLabel={translate('accounts.type')} className="flex-row flex-wrap gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: field.state.value === t }}
                    label={ACCOUNT_TYPE_LABELS[t]}
                    selected={field.state.value === t}
                    onPress={() => field.handleChange(t)}
                  />
                ))}
              </View>
            </>
          )}
        />

        <DetailsCard form={form} isCreate={isCreate} />

        {onArchive && (
          <GhostButton color="danger" className="mt-4" label={translate('accounts.archive_account')} onPress={onArchive} />
        )}
        {onDelete && (
          <GhostButton color="danger" className="mt-2" label={translate('accounts.delete_account')} onPress={onDelete} />
        )}
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View className="bg-background px-5 py-2">
          <form.Subscribe
            selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
            children={(state) => (
              <SolidButton
                color="primary"
                size="lg"
                fullWidth
                label={translate(isCreate ? 'accounts.create' : 'common.save')}
                onPress={form.handleSubmit}
                loading={state.isSubmitting || isLoading}
                disabled={!schema.safeParse(state.values).success}
              />
            )}
          />
        </View>
      </KeyboardStickyView>
    </>
  );
}

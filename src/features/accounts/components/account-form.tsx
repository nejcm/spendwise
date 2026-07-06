import type { AccountFormData, AccountType } from '../types';
import type { CurrencyKey } from '@/features/currencies';
import { useForm } from '@tanstack/react-form';
import { Keyboard, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
import ColorSelector from '@/components/color-selector';
import { GhostButton, Image, Input, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { CURRENCY_VALUES } from '@/features/currencies';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { translate } from '@/lib/i18n';
import { addLastUsedCurrency, selectAccountFormPrefs, setAccountFormPrefs, useAppStore } from '@/lib/store/store';
import { getRandomColor } from '@/lib/theme/colors';
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
});

const defaultValues: AccountFormData = {
  name: '',
  type: 'checking',
  description: null,
  color: 'bg-sky-600',
  currency: 'USD',
  icon: null,
  budget: null,
};

export type AccountFormBaseProps = {
  initialData?: AccountFormData;
  accountId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function useAccountForm(
  initialData?: AccountFormData,
  accountId?: string,
  onSuccess?: () => void,
) {
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const preferredCurrency = useAppStore.use.currency();
  const isCompact = useAppStore.use.density() === 'compact';
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
      setAccountFormPrefs({ type: data.type, currency: data.currency });
      addLastUsedCurrency(data.currency);
      onSuccess?.();
    },
  });

  return { form, createAccount, updateAccount, preferredCurrency, isCompact };
}

type UseAccountFormReturn = ReturnType<typeof useAccountForm>;

type AccountFormBodyProps = {
  form: UseAccountFormReturn['form'];
  isCompact: boolean;
  preferredCurrency: CurrencyKey;
};

function AccountFormBody({ form, preferredCurrency, isCompact }: AccountFormBodyProps) {
  const inputSize = isCompact ? 'md' : 'lg';
  return (
    <>
      <View className="mb-2 flex-row items-center justify-center gap-3">
        <form.Field
          name="color"
          children={(field) => (
            <ColorSelector
              value={field.state.value ?? 'bg-sky-600'}
              onSelect={(value) => field.handleChange(String(value))}
              stackBehavior="push"
              size={isCompact ? 'xl' : '2xl'}
            />
          )}
        />
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
              containerClassName="w-[100]"
              className="px-0.5 text-center text-3xl"
              size={isCompact ? 'xl' : '2xl'}
            />
          )}
        />
      </View>

      <form.Field
        name="name"
        children={(field) => (
          <Input
            size={inputSize}
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
            size={inputSize}
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
                  color={field.state.value === t ? 'default' : 'secondary'}
                  label={ACCOUNT_TYPE_LABELS[t]}
                  onPress={() => field.handleChange(t)}
                />
              ))}
            </View>
          </View>
        )}
      />

      <View className="flex-row gap-2">
        <View className="w-[85] flex-row items-center justify-center gap-2 pr-4 pl-0">
          <Image source={CURRENCY_IMAGES[preferredCurrency]} className="size-6 rounded-full" />
          <Text className="border-none bg-transparent">
            {preferredCurrency}
          </Text>
        </View>
        <form.Field
          name="budget"
          children={(field) => (
            <Input
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              size={inputSize}
              onChangeText={field.handleChange}
              placeholder={translate('accounts.budget_placeholder')}
              keyboardType="decimal-pad"
              containerClassName="flex-1"
              error={getFieldError(field)}
            />
          )}
        />
      </View>

    </>
  );
}

export type AccountFormProps = AccountFormBaseProps;
export function AccountForm({
  initialData,
  accountId,
  onSuccess,
  onCancel,
}: AccountFormProps) {
  const { form, createAccount, updateAccount, preferredCurrency, isCompact } = useAccountForm(
    initialData,
    accountId,
    onSuccess,
  );

  const isLoading = createAccount.isPending || updateAccount.isPending;
  const insets = useSafeAreaInsets();
  const stickyFooterPadding = 56 + insets.bottom;
  const buttonSize = isCompact ? 'sm' : 'md';

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: isCompact ? 8 : 12, paddingBottom: 8 + stickyFooterPadding, paddingHorizontal: 16, paddingTop: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <AccountFormBody
          form={form}
          isCompact={isCompact}
          preferredCurrency={preferredCurrency}
        />
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View className="flex-row gap-3 border-t border-border bg-background px-4 py-2">
          <form.Subscribe
            selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
            children={(state) => (
              <>
                {onCancel && (
                  <GhostButton
                    size={buttonSize}
                    textClassName="text-base/tight"
                    label={translate('common.cancel')}
                    onPress={onCancel}
                  />
                )}
                <SolidButton
                  size={buttonSize}
                  textClassName="text-base/tight"
                  label={translate('common.save')}
                  onPress={form.handleSubmit}
                  loading={(!!state.isSubmitting) || isLoading}
                  disabled={!schema.safeParse(state.values).success}
                  className="flex-1"
                />
              </>
            )}
          />
        </View>
      </KeyboardStickyView>
    </>
  );
}

import type { StyleProp, ViewStyle } from 'react-native';
import type { GlobalBudget, GlobalBudgetType } from '../global-budget-queries';
import { useForm } from '@tanstack/react-form';
import { View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

import { GhostButton, Input, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { centsToAmount } from '@/features/formatting/helpers';
import { parseToCents } from '@/lib/data/money';
import { translate } from '@/lib/i18n';
import { refinePositiveNumberOrNull } from '@/lib/validation/helpers';
import { useSetGlobalBudget } from '../hooks';

const schema = z.object({
  amount: z
    .string()
    .min(1, translate('stats.global_budget_invalid'))
    .nullable()
    .refine(refinePositiveNumberOrNull, translate('categories.budget_invalid')),
  type: z.enum(['monthly', 'yearly']),
});

type GlobalBudgetFormProps = {
  currentBudget: GlobalBudget | null;
  onSuccess: () => void;
  onCancel: () => void;
  style?: StyleProp<ViewStyle>;
};

type GlobalBudgetFormData = {
  amount: string | null;
  type: GlobalBudgetType;
};

const defaultValues: GlobalBudgetFormData = {
  amount: null,
  type: 'monthly',
};

export function GlobalBudgetForm({ currentBudget, onSuccess, onCancel, style }: GlobalBudgetFormProps) {
  const insets = useSafeAreaInsets();
  const setGlobalBudget = useSetGlobalBudget();
  const stickyFooterPadding = 56 + insets.bottom;

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      ...currentBudget,
      amount: currentBudget?.amountCents ? String(centsToAmount(currentBudget.amountCents)) : null,
    } as GlobalBudgetFormData,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const cents = parseToCents(value.amount);
      const updatedValue = !cents
        ? null
        : {
            amountCents: cents,
            type: value.type,
          };
      await setGlobalBudget.mutateAsync(updatedValue);
      onSuccess();
    },
  });

  return (
    <>
      <KeyboardAwareScrollView style={{ flex: 1, ...style }}>
        <View className="gap-6 px-4" style={{ paddingBottom: 16 + stickyFooterPadding }}>
          <form.Field
            name="type"
            children={(field) => (
              <View className="gap-2">
                <Text className="text-sm/snug font-medium">
                  {translate('stats.global_budget_type_label')}
                </Text>
                <View className="flex-row gap-2">
                  <SolidButton
                    className="items-center rounded-3xl px-6"
                    color={field.state.value === 'monthly' ? 'default' : 'secondary'}
                    size="sm"
                    label={translate('stats.global_budget_type_monthly')}
                    onPress={() => field.handleChange('monthly')}
                  />
                  <SolidButton
                    className="items-center rounded-3xl px-6"
                    color={field.state.value === 'yearly' ? 'default' : 'secondary'}
                    size="sm"
                    label={translate('stats.global_budget_type_yearly')}
                    onPress={() => field.handleChange('yearly')}
                  />
                </View>
              </View>
            )}
          />
          <form.Field
            name="amount"
            children={(field) => (
              <Input
                label={translate('stats.global_budget_label')}
                value={field.state.value ?? ''}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder={translate('stats.global_budget_placeholder')}
                keyboardType="decimal-pad"
                error={getFieldError(field)}
                autoFocus
              />
            )}
          />
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View className="flex-row gap-3 border-t border-border bg-background px-4 py-2">
          <form.Subscribe
            selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
            children={() => (
              <>
                {onCancel && (
                  <GhostButton
                    label={translate('common.cancel')}
                    onPress={onCancel}
                  />
                )}
                <SolidButton
                  color="primary"
                  label={translate('common.save')}
                  onPress={form.handleSubmit}
                  loading={setGlobalBudget.isPending}
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

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { GlobalBudget, GlobalBudgetType } from '../global-budget-queries';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';

import { GhostButton, Input, ModalSheet, SegmentedControl, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { centsToAmount } from '@/features/formatting/helpers';
import { parseToCents } from '@/lib/data/money';
import { translate } from '@/lib/i18n';
import { refinePositiveNumberOrNull } from '@/lib/validation/helpers';
import { useGlobalBudget, useSetGlobalBudget } from '../hooks';

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
};

type GlobalBudgetFormData = {
  amount: string | null;
  type: GlobalBudgetType;
};

const defaultValues: GlobalBudgetFormData = {
  amount: null,
  type: 'monthly',
};

const snapPoints = ['85%'];

function GlobalBudgetForm({ currentBudget, onSuccess, onCancel }: GlobalBudgetFormProps) {
  const setGlobalBudget = useSetGlobalBudget();
  const typeOptions = [
    { value: 'monthly', label: translate('stats.global_budget_type_monthly') },
    { value: 'yearly', label: translate('stats.global_budget_type_yearly') },
  ] as const;

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
    <View className="gap-6 px-4 pt-2 pb-6">
      <form.Field
        name="type"
        children={(field) => (
          <View className="gap-2">
            <Text className="text-sm/snug font-medium">
              {translate('stats.global_budget_type_label')}
            </Text>
            <SegmentedControl
              options={typeOptions}
              value={field.state.value}
              onChange={field.handleChange}
              accessibilityLabel={translate('stats.global_budget_type_label')}
            />
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
            sheet
          />
        )}
      />
      <View className="flex-row gap-3">
        <GhostButton
          label={translate('common.cancel')}
          onPress={onCancel}
        />
        <SolidButton
          color="primary"
          label={translate('common.save')}
          onPress={form.handleSubmit}
          loading={setGlobalBudget.isPending}
          className="flex-1"
        />
      </View>
    </View>
  );
}

export function BudgetSheet({ ref }: { ref: React.RefObject<BottomSheetModal<any> | null> }) {
  const { data: currentBudget = null, isLoading } = useGlobalBudget();
  const close = React.useCallback(() => ref.current?.close(), [ref]);

  return (
    <ModalSheet ref={ref} title={translate('stats.global_budget_label')} snapPoints={snapPoints}>
      <BottomSheetScrollView keyboardShouldPersistTaps="handled">
        {isLoading
          ? <Text className="px-4 py-6 text-center">{translate('common.loading')}</Text>
          : <GlobalBudgetForm currentBudget={currentBudget} onSuccess={close} onCancel={close} />}
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

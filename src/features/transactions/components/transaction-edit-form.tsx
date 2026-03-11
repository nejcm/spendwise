import type { Category } from '../../categories/types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';

import * as z from 'zod';
import { Button, FocusAwareStatusBar, Input } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { translate } from '@/lib/i18n';
import { CategoryPicker } from './category-picker';

const schema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  category_id: z.string().nullable(),
  note: z.string(),
});

export type TransactionEditFormValues = z.infer<typeof schema>;

type Props = {
  initialValues: TransactionEditFormValues;
  categories: Category[];
  onSave: (data: TransactionEditFormValues) => void;
  onCancel: () => void;
  isSaving: boolean;
};

export function TransactionEditForm({ initialValues, categories, onSave, onCancel, isSaving }: Props) {
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      onSave(value);
    },
  });

  return (
    <View className="flex-1 px-4 pt-4">
      <FocusAwareStatusBar />

      <form.Field
        name="amount"
        children={(field) => (
          <Input
            label={translate('transactions.amount')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            keyboardType="decimal-pad"
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="category_id"
        children={(field) => (
          <CategoryPicker
            categories={categories}
            selectedId={field.state.value}
            onSelect={(cat) => field.handleChange(cat.id)}
            label={translate('transactions.category')}
          />
        )}
      />

      <form.Field
        name="note"
        children={(field) => (
          <Input
            label={translate('transactions.note')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Subscribe
        selector={(state) => [state.isSubmitting]}
        children={([isSubmittingForm]) => (
          <View className="mt-4 gap-2">
            <Button
              label={translate('common.save')}
              onPress={form.handleSubmit}
              loading={(isSubmittingForm as boolean) || isSaving}
            />
            <Button label={translate('common.cancel')} variant="outline" onPress={onCancel} />
          </View>
        )}
      />
    </View>
  );
}

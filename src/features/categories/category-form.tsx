import type { Category, CategoryFormData } from './types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import * as z from 'zod';
import { Input, SolidButton } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { ACCOUNT_COLORS } from '@/features/accounts/types';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import Alert from '../../components/ui/alert';
import { OutlineButton } from '../../components/ui/outline-button';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string(),
  sort_order: z.number().optional(),
});

type CategoryInitialValues = (Partial<CategoryFormData> & { id: undefined }) | (CategoryFormData & { id: Category['id'] });

export type CategoryManageModalProps = {
  initialValues?: CategoryInitialValues;
};

export function CategoryForm({ initialValues }: CategoryManageModalProps) {
  const id = initialValues?.id;
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm({
    defaultValues: {
      name: '',
      color: ACCOUNT_COLORS[0],
      ...initialValues,
    } as CategoryFormData,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const onSuccess = () => {
        form.reset();
      };
      if (id) {
        updateCategory.mutate(
          { id, data: value },
          {
            onSuccess,
          },
        );
      }
      else {
        createCategory.mutate(
          { ...value, sort_order: categories.length },
          {
            onSuccess,
          },
        );
      }
    },
  });

  const deleteCategory = useDeleteCategory();
  const onDeletePress = (id: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(id) },
    ]);
  };

  return (
    <>
      <form.Field
        name="name"
        children={(field) => (
          <Input
            label={translate('settings.category_name')}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />

      <form.Field
        name="color"
        children={(field) => (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {ACCOUNT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => field.handleChange(c)}
                className={`size-8 rounded-full ${field.state.value === c ? 'border-2 border-primary-400' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </View>
        )}
      />

      {!!id && (
        <SolidButton
          label={translate('common.delete')}
          color="danger"
          onPress={() => onDeletePress(id, initialValues?.name ?? '')}
          className="mt-8 w-full"
        />
      )}
      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.values.name]}
        children={([isSubmitting, name]) => (
          <View className={`flex-row gap-3 ${id ? 'mt-4' : 'mt-8'}`}>
            <OutlineButton
              label={translate('common.cancel')}
              onPress={() => {
                form.reset();
              }}
              className="flex-1"
            />
            <SolidButton
              label={translate('common.save')}
              onPress={form.handleSubmit}
              disabled={!(name as string).trim() || (isSubmitting as boolean) || createCategory.isPending}
              loading={(isSubmitting as boolean) || createCategory.isPending}
              className="flex-1"
            />
          </View>
        )}
      />
    </>
  );
}

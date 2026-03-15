import type { Category, CategoryFormData } from './types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';

import { Input, SolidButton } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { getFieldError } from '@/components/ui/form-utils';
import { GhostButton } from '@/components/ui/ghost-button';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import ColorSelector from '../../components/color-selector';
import { OutlineButton } from '../../components/ui/outline-button';

const schema = z.object({
  name: z.string().min(1, translate('categories.name_required')),
  icon: z.string().max(2).nullable(),
  color: z.string(),
});

type CategoryInitialValues = (Partial<CategoryFormData> & { id: undefined }) | (CategoryFormData & { id: Category['id'] });

export type CategoryManageModalProps = {
  initialValues?: CategoryInitialValues;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const defaultValues: CategoryFormData = {
  name: '',
  icon: null,
  color: 'bg-sky-600',
};

export function CategoryForm({ initialValues, onSuccess, onCancel }: CategoryManageModalProps) {
  const id = initialValues?.id;
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    } as CategoryFormData,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      if (id) {
        await updateCategory.mutateAsync({ id, data: value });
        onSuccess?.();
        return;
      }
      await createCategory.mutateAsync({ ...value, sort_order: categories.length });
      form.reset();
      onSuccess?.();
    },
  });

  const deleteCategory = useDeleteCategory();
  const onDeletePress = (categoryId: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(categoryId) },
    ]);
  };

  return (
    <View className="gap-4">
      <form.Field
        name="name"
        children={(field) => (
          <Input
            label={translate('common.name')}
            value={field.state.value}
            onBlur={field.handleBlur}
            placeholder={translate('categories.name_placeholder')}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
          />
        )}
      />

      <View className="mb-8 flex-row items-center gap-3">
        <form.Field
          name="color"
          children={(field) => (
            <ColorSelector
              value={field.state.value}
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
              placeholder={translate('categories.icon_placeholder')}
              containerClassName="flex-1"
              className="text-3xl"
              size="xl"
            />
          )}
        />
      </View>

      {!!id && (
        <OutlineButton
          label={translate('common.delete')}
          color="danger"
          onPress={() => onDeletePress(id, initialValues?.name ?? '')}
          className="w-full"
        />
      )}

      <form.Subscribe
        selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
        children={(state) => (
          <View className="flex-row items-center gap-3">
            {onCancel && (
              <GhostButton
                label={translate('common.cancel')}
                onPress={onCancel}
                color="secondary"
              />
            )}
            <SolidButton
              label={translate('common.save')}
              onPress={form.handleSubmit}
              loading={(!!state.isSubmitting) || createCategory.isPending || updateCategory.isPending}
              disabled={!schema.safeParse(state.values).success}
              className="flex-1"
            />
          </View>
        )}
      />
    </View>
  );
}

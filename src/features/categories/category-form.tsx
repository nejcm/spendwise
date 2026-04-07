import type { Category, CategoryFormData } from './types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { View } from 'react-native';
import * as z from 'zod';

import ColorSelector from '@/components/color-selector';
import { Alert, GhostButton, Image, Input, SolidButton, Text } from '@/components/ui';

import { getFieldError } from '@/components/ui/form-utils';
import { OutlineButton } from '@/components/ui/outline-button';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/categories/api';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { translate } from '@/lib/i18n';
import { closeSheet } from '@/lib/local-store';
import { useAppStore } from '@/lib/store';
import { getRandomColor } from '@/lib/theme/colors';
import { refinePositiveNumber } from '@/lib/validation/helpers';

const schema = z.object({
  name: z.string().min(1, translate('categories.name_required')),
  icon: z.emoji().nullable(),
  color: z.string(),
  budget: z.string().nullable().refine(refinePositiveNumber, translate('categories.budget_invalid')),
});

export type CategoryInitialValues = (Partial<CategoryFormData> & { id: undefined }) | (CategoryFormData & { id: Category['id'] });

export type CategoryManageModalProps = {
  initialValues?: CategoryInitialValues;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const defaultValues: CategoryFormData = {
  name: '',
  icon: null,
  color: 'bg-sky-600',
  budget: null,
};

export function CategoryForm({ initialValues, onSuccess, onCancel }: CategoryManageModalProps) {
  const id = initialValues?.id;
  const { data: categories = [] } = useCategories();
  const preferredCurrency = useAppStore.use.currency();
  const createCategory = useCreateCategory(() => closeSheet());
  const updateCategory = useUpdateCategory(() => closeSheet());

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      color: getRandomColor(),
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

  const deleteCategory = useDeleteCategory(() => closeSheet());
  const onDeletePress = (categoryId: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(categoryId) },
    ]);
  };

  return (
    <View className="flex-1 gap-4">
      <View className="mb-2 flex-row items-center justify-center gap-3">
        <form.Field
          name="color"
          children={(field) => (
            <ColorSelector
              value={field.state.value}
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
              placeholder={translate('categories.icon_placeholder')}
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
            value={field.state.value}
            onBlur={field.handleBlur}
            placeholder={translate('categories.name_placeholder')}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            size="lg"
          />
        )}
      />

      <View className="mb-6">
        <View className="flex-row gap-2">
          <View className="w-[100] flex-row items-center justify-center gap-2 px-4">
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
                onChangeText={field.handleChange}
                placeholder={translate('categories.budget_placeholder')}
                keyboardType="decimal-pad"
                containerClassName="flex-1"
                size="lg"
                error={getFieldError(field)}
              />
            )}
          />
        </View>
      </View>

      <form.Subscribe
        selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
        children={(state) => (
          <View className="mt-auto flex-row items-center gap-3">
            {onCancel && (
              <OutlineButton
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

      {!!id && (
        <View className="flex-row justify-center">
          <GhostButton
            label={translate('common.delete')}
            color="danger"
            size="sm"
            textClassName="text-base/snug"
            onPress={() => onDeletePress(id, initialValues?.name ?? '')}
            fullWidth
          />
        </View>
      )}
    </View>
  );
}

import type { Category, CategoryFormData } from './types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { Pressable, View } from 'react-native';

import * as z from 'zod';
import { Button, Input, Modal, Text, useModal } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { ACCOUNT_COLORS } from '@/features/accounts/types';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import Alert from '../../components/ui/alert';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['expense', 'income']),
  color: z.string(),
  sort_order: z.number().optional(),
});

type CategoryInitialValues = (Partial<CategoryFormData> & { id: undefined }) | (CategoryFormData & { id: Category['id'] });

export type CategoryManageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: CategoryInitialValues;
};

export function CategoryManageModal({ isOpen, onClose, initialValues }: CategoryManageModalProps) {
  const { ref: modalRef } = useModal();
  const id = initialValues?.id;
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm({
    defaultValues: {
      name: '',
      type: 'expense',
      color: ACCOUNT_COLORS[0],
      ...initialValues,
    } as CategoryFormData,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const onSuccess = () => {
        form.reset();
        onClose();
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

  const deleteCategory = useDeleteCategory(onClose);
  const onDeletePress = (id: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(id) },
    ]);
  };

  React.useEffect(() => {
    if (isOpen) modalRef.current?.present();
    else modalRef.current?.dismiss();
  }, [isOpen, modalRef]);

  return (
    <Modal ref={modalRef} snapPoints={['55%']} title={id ? translate('categories.edit_category') : translate('categories.add_category')}>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
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
          name="type"
          children={(field) => (
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => field.handleChange('expense')}
                className={`rounded-full px-3 py-1.5 ${field.state.value === 'expense' ? 'bg-primary-400' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                <Text className={`text-sm ${field.state.value === 'expense' ? 'font-medium text-white' : ''}`}>
                  {translate('transactions.expense')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => field.handleChange('income')}
                className={`rounded-full px-3 py-1.5 ${field.state.value === 'income' ? 'bg-primary-400' : 'bg-gray-100 dark:bg-gray-700'}`}
              >
                <Text className={`text-sm ${field.state.value === 'income' ? 'font-medium text-white' : ''}`}>
                  {translate('transactions.income')}
                </Text>
              </Pressable>
            </View>
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
          <Button
            label={translate('common.delete')}
            variant="destructive"
            onPress={() => onDeletePress(id, initialValues?.name ?? '')}
            className="mt-8 w-full"
          />
        )}
        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values.name]}
          children={([isSubmitting, name]) => (
            <View className={`flex-row gap-3 ${id ? 'mt-4' : 'mt-8'}`}>
              <Button
                label={translate('common.cancel')}
                variant="outline"
                onPress={() => {
                  form.reset();
                  onClose();
                }}
                className="flex-1"
              />
              <Button
                label={translate('common.save')}
                onPress={form.handleSubmit}
                disabled={!(name as string).trim() || (isSubmitting as boolean) || createCategory.isPending}
                loading={(isSubmitting as boolean) || createCategory.isPending}
                className="flex-1"
              />
            </View>
          )}
        />
      </BottomSheetScrollView>
    </Modal>
  );
}

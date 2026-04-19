import type { Category, CategoryFormData } from './types';
import { useForm } from '@tanstack/react-form';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

import ColorSelector from '@/components/color-selector';
import { Alert, GhostButton, Image, Input, SolidButton, Text, TrashIcon } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import BottomSheetKeyboardAwareScrollView from '@/components/ui/modal-keyboard-aware-scroll-view';
import { OutlineButton } from '@/components/ui/outline-button';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/categories/api';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { translate } from '@/lib/i18n';
import { closeSheet } from '@/lib/store/local-store';
import { useAppStore } from '@/lib/store/store';
import { getRandomColor } from '@/lib/theme/colors';
import { refinePositiveNumberOrNull } from '@/lib/validation/helpers';

const schema = z.object({
  name: z.string().min(1, translate('categories.name_required')),
  icon: z.emoji().nullable(),
  color: z.string(),
  budget: z.string().nullable().refine(refinePositiveNumberOrNull, translate('categories.budget_invalid')),
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

function useCategoryForm(initialValues?: CategoryInitialValues, onSuccess?: () => void) {
  const id = initialValues?.id;
  const { data: categories = [] } = useCategories();
  const preferredCurrency = useAppStore.use.currency();
  const createCategory = useCreateCategory(() => closeSheet());
  const updateCategory = useUpdateCategory(() => closeSheet());
  const deleteCategory = useDeleteCategory(() => closeSheet());

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

  return { form, createCategory, updateCategory, deleteCategory, preferredCurrency, id };
}

type UseCategoryFormReturn = ReturnType<typeof useCategoryForm>;

type CategoryFormBodyProps = {
  form: UseCategoryFormReturn['form'];
  preferredCurrency: UseCategoryFormReturn['preferredCurrency'];
  deleteCategory: UseCategoryFormReturn['deleteCategory'];
  id: UseCategoryFormReturn['id'];
  initialValues?: CategoryInitialValues;
};

function CategoryFormBody({ form, preferredCurrency, deleteCategory, id, initialValues }: CategoryFormBodyProps) {
  const onDeletePress = (categoryId: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(categoryId) },
    ]);
  };

  return (
    <>
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

      {!!id && (
        <GhostButton
          label={translate('common.delete')}
          color="danger"
          className="mt-6"
          fullWidth
          textClassName="underline"
          iconLeft={<TrashIcon size={16} colorClassName="accent-danger-600" className="mr-2" />}
          onPress={() => onDeletePress(id, initialValues?.name ?? '')}
        />
      )}
    </>
  );
}

export function CategoryForm({ initialValues, onSuccess, onCancel }: CategoryManageModalProps) {
  const { form, createCategory, updateCategory, deleteCategory, preferredCurrency, id } = useCategoryForm(
    initialValues,
    onSuccess,
  );

  return (
    <View className="flex-1 gap-4">
      <CategoryFormBody
        form={form}
        preferredCurrency={preferredCurrency}
        deleteCategory={deleteCategory}
        id={id}
        initialValues={initialValues}
      />
      <View className="mt-auto flex-row gap-3 pt-4">
        <form.Subscribe
          selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
          children={(state) => (
            <>
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
            </>
          )}
        />
      </View>
    </View>
  );
}

export type CategoryFormSheetProps = CategoryManageModalProps;
export function CategoryFormSheet({
  initialValues,
  onSuccess,
  onCancel,
}: CategoryFormSheetProps) {
  const { form, createCategory, updateCategory, deleteCategory, preferredCurrency, id } = useCategoryForm(
    initialValues,
    onSuccess,
  );

  const isLoading = createCategory.isPending || updateCategory.isPending;
  const insets = useSafeAreaInsets();

  return (
    <>
      <BottomSheetKeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 8, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <CategoryFormBody
          form={form}
          preferredCurrency={preferredCurrency}
          deleteCategory={deleteCategory}
          id={id}
          initialValues={initialValues}
        />
      </BottomSheetKeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View className="flex-row gap-3 border-t border-border bg-background px-4 py-2">
          <form.Subscribe
            selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
            children={(state) => (
              <>
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

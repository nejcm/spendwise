import type { Category, CategoryFormData } from './types';
import { useForm } from '@tanstack/react-form';
import { Keyboard, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

import ColorSelector from '@/components/color-selector';
import { Alert, GhostButton, Image, Input, SolidButton, Text, TrashIcon } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/features/categories/api';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { translate } from '@/lib/i18n';
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

export type CategoryFormBaseProps = {
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
  const isCompact = useAppStore.use.density() === 'compact';
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory(onSuccess);

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

  return { form, createCategory, updateCategory, deleteCategory, preferredCurrency, id, isCompact };
}

type UseCategoryFormReturn = ReturnType<typeof useCategoryForm>;

type CategoryFormBodyProps = {
  isCompact: boolean;
  form: UseCategoryFormReturn['form'];
  preferredCurrency: UseCategoryFormReturn['preferredCurrency'];
  deleteCategory: UseCategoryFormReturn['deleteCategory'];
  id: UseCategoryFormReturn['id'];
  initialValues?: CategoryInitialValues;
};

function CategoryFormBody({ form, preferredCurrency, deleteCategory, id, initialValues, isCompact }: CategoryFormBodyProps) {
  const onDeletePress = (categoryId: string, name: string) => {
    Alert.alert(translate('common.delete'), translate('categories.delete_confirm', { name }), [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('common.delete'), style: 'destructive', onPress: () => deleteCategory.mutate(categoryId) },
    ]);
  };
  const inputSize = isCompact ? 'md' : 'lg';

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
              placeholder={translate('categories.icon_placeholder')}
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
            value={field.state.value}
            onBlur={field.handleBlur}
            placeholder={translate('categories.name_placeholder')}
            onChangeText={field.handleChange}
            error={getFieldError(field)}
            size={inputSize}
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
              size={inputSize}
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

export type CategoryFormProps = CategoryFormBaseProps;
export function CategoryForm({
  initialValues,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const { form, createCategory, updateCategory, deleteCategory, preferredCurrency, id, isCompact } = useCategoryForm(
    initialValues,
    onSuccess,
  );

  const isLoading = createCategory.isPending || updateCategory.isPending;
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
        <CategoryFormBody
          form={form}
          isCompact={isCompact}
          preferredCurrency={preferredCurrency}
          deleteCategory={deleteCategory}
          id={id}
          initialValues={initialValues}
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
                  color="primary"
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

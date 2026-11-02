import type { Category, CategoryFormData } from './types';
import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';
import { Card, Chip, getPressedStyle, GhostButton, Input, SegmentedControl, SolidButton, Text, useModalSheet } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { ChevronRight } from '@/components/ui/icon';
import { CURRENCIES_MAP } from '@/features/currencies';
import { centsToAmount } from '@/features/formatting/helpers';
import { useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { getRandomColor, hexWithOpacity } from '@/lib/theme/colors';
import { refinePositiveNumberOrNull } from '@/lib/validation/helpers';
import { ColorSheet } from './components/color-sheet';
import { DeleteCategorySheet } from './components/delete-category-sheet';
import { averageOfLast, buildMonthBars, colorLabel, monthBarsRange } from './helpers';
import { useCategories, useCategoryMonthlyTotals, useCreateCategory, useFormatMoney, useUpdateCategory } from './hooks';

const schema = z.object({
  name: z.string().min(1, translate('categories.name_required')),
  icon: z.emoji().nullable(),
  color: z.string(),
  kind: z.enum(['expense', 'income']),
  budget: z.string().nullable().refine(refinePositiveNumberOrNull, translate('categories.budget_invalid')),
});

const KIND_OPTIONS = [
  { value: 'expense', label: translate('categories.kind_expense') },
  { value: 'income', label: translate('categories.kind_income') },
] as const;

export type CategoryInitialValues = (Partial<CategoryFormData> & { id: undefined }) | (CategoryFormData & { id: Category['id'] });

export type CategoryFormProps = {
  initialValues?: CategoryInitialValues;
  onSuccess?: () => void;
  onDeleted?: () => void;
};

const defaultValues: CategoryFormData = {
  name: '',
  icon: null,
  color: 'bg-sky-600',
  kind: 'expense',
  budget: null,
};

function useCategoryForm(initialValues?: CategoryInitialValues, onSuccess?: () => void) {
  const id = initialValues?.id;
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm({
    defaultValues: {
      ...defaultValues,
      color: getRandomColor(),
      ...initialValues,
    } as CategoryFormData,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const data = { ...value, budget: value.kind === 'income' ? null : value.budget };
      if (id) {
        await updateCategory.mutateAsync({ id, data });
      }
      else {
        await createCategory.mutateAsync({ ...data, sort_order: categories.length });
        form.reset();
      }
      onSuccess?.();
    },
  });

  return { form, isLoading: createCategory.isPending || updateCategory.isPending };
}

type CategoryFormApi = ReturnType<typeof useCategoryForm>['form'];

function FieldLabel({ children }: { children: string }) {
  return <Text className="px-1 pt-4 pb-1.5 text-meta font-medium text-muted-foreground">{children}</Text>;
}

function IdentityCard({ form }: { form: CategoryFormApi }) {
  const colorSheet = useModalSheet();
  return (
    <form.Subscribe
      selector={(s) => s.values}
      children={(values) => (
        <Card className="gap-3 p-4">
          <View className="flex-row items-center gap-4">
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
                  accessibilityLabel={translate('categories.icon')}
                  containerClassName="shrink-0"
                  className="size-16 rounded-card border-0 px-0 text-center text-3xl"
                  style={{ backgroundColor: hexWithOpacity(values.color, 26) }}
                />
              )}
            />
            <Text className="min-w-0 flex-1 text-meta text-muted-foreground">{translate('categories.tap_emoji')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${translate('categories.colour')}: ${colorLabel(values.color)}`}
            onPress={colorSheet.present}
            style={getPressedStyle}
            className="flex-row items-center gap-3 rounded-tile bg-card-2 px-3 py-2.5"
          >
            <View className="size-7 rounded-full" style={{ backgroundColor: values.color }} />
            <View className="min-w-0 flex-1">
              <Text className="text-meta text-muted-foreground">{translate('categories.colour')}</Text>
              <Text className="text-row font-medium">{colorLabel(values.color)}</Text>
            </View>
            <ChevronRight size={16} colorClassName="accent-muted-foreground" />
          </Pressable>
          <ColorSheet
            ref={colorSheet.ref}
            value={values.color}
            name={values.name}
            icon={values.icon || values.name.slice(0, 1).toUpperCase()}
            onSelect={(color) => {
              form.setFieldValue('color', color);
              colorSheet.close();
            }}
          />
        </Card>
      )}
    />
  );
}

function BudgetAverage({ id, onUse }: { id: string; onUse: (cents: number | null) => void }) {
  const format = useFormatMoney();
  const yearMonth = useCurrentYearMonth();
  const [start, end] = React.useMemo(() => monthBarsRange(yearMonth, 3), [yearMonth]);
  const { data: rows = [] } = useCategoryMonthlyTotals(id, start, end);
  const average = averageOfLast(buildMonthBars(rows, yearMonth, 'expense', 3));
  const rounded = Math.ceil(average / 100) * 100;

  return (
    <>
      {average > 0 && (
        <Text className="mt-2 text-meta text-muted-foreground">{translate('categories.averaged', { amount: format(average) })}</Text>
      )}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {average > 0 && <Chip label={translate('categories.use_amount', { amount: format(rounded, 0) })} onPress={() => onUse(rounded)} />}
        <Chip label={translate('categories.no_budget')} onPress={() => onUse(null)} />
      </View>
    </>
  );
}

function BudgetCard({ form, id }: { form: CategoryFormApi; id?: string }) {
  const currency = useAppStore.use.currency();
  return (
    <form.Field
      name="budget"
      children={(field) => (
        <Card className="mt-5 p-4">
          <Text className="text-meta font-medium text-muted-foreground">{translate('categories.budget')}</Text>
          <View className="mt-1 flex-row items-center gap-1">
            <Text className="text-[30px] font-bold text-muted-foreground">{CURRENCIES_MAP[currency].symbol}</Text>
            <Input
              value={field.state.value ?? ''}
              onBlur={field.handleBlur}
              onChangeText={(v) => field.handleChange(v.trim() ? v : null)}
              placeholder="0"
              accessibilityLabel={translate('categories.budget')}
              keyboardType="decimal-pad"
              containerClassName="flex-1"
              className="h-auto rounded-none border-0 bg-transparent px-0 text-[30px] font-bold"
              error={getFieldError(field)}
            />
          </View>
          {id
            ? <BudgetAverage id={id} onUse={(cents) => field.handleChange(cents == null ? null : String(centsToAmount(cents)))} />
            : field.state.value && (
              <View className="mt-3 flex-row">
                <Chip label={translate('categories.no_budget')} onPress={() => field.handleChange(null)} />
              </View>
            )}
        </Card>
      )}
    />
  );
}

export function CategoryForm({ initialValues, onSuccess, onDeleted }: CategoryFormProps) {
  const { form, isLoading } = useCategoryForm(initialValues, onSuccess);
  const insets = useSafeAreaInsets();
  const deleteSheet = useModalSheet();
  const { data: categories = [] } = useCategories();
  const id = initialValues?.id;
  const stored = id ? categories.find((c) => c.id === id) ?? null : null;

  return (
    <>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 88 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        <IdentityCard form={form} />

        <form.Field
          name="name"
          children={(field) => (
            <>
              <FieldLabel>{translate('common.name')}</FieldLabel>
              <Input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChangeText={field.handleChange}
                placeholder={translate('categories.name_placeholder')}
                accessibilityLabel={translate('common.name')}
                className="rounded-tile border-0 bg-card"
                error={getFieldError(field)}
              />
            </>
          )}
        />

        <form.Field
          name="kind"
          children={(field) => (
            <>
              <FieldLabel>{translate('categories.kind')}</FieldLabel>
              <SegmentedControl
                fill={false}
                options={KIND_OPTIONS}
                value={field.state.value}
                onChange={field.handleChange}
                accessibilityLabel={translate('categories.kind')}
              />
            </>
          )}
        />

        <form.Subscribe
          selector={(s) => s.values.kind}
          children={(kind) => kind === 'expense' && <BudgetCard form={form} id={id} />}
        />

        {stored && (
          <GhostButton color="danger" className="mt-4" label={translate('categories.delete_category')} onPress={deleteSheet.present} />
        )}
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View className="bg-background px-5 py-2">
          <form.Subscribe
            selector={({ isSubmitting, values }) => ({ isSubmitting, values })}
            children={(state) => (
              <SolidButton
                color="primary"
                size="lg"
                fullWidth
                label={translate(id ? 'categories.save' : 'categories.create')}
                onPress={form.handleSubmit}
                loading={state.isSubmitting || isLoading}
                disabled={!schema.safeParse(state.values).success}
              />
            )}
          />
        </View>
      </KeyboardStickyView>
      {stored && (
        <DeleteCategorySheet ref={deleteSheet.ref} category={stored} onDeleted={onDeleted} onClose={deleteSheet.close} />
      )}
    </>
  );
}

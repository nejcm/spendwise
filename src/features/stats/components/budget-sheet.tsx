import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { GlobalBudget, GlobalBudgetType } from '../global-budget-queries';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useForm, useStore } from '@tanstack/react-form';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import * as z from 'zod';
import { Input, ModalSheet, SegmentedControl, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useCategories } from '@/features/categories/api';
import { averageOfLast, buildMonthBars, monthBarsRange } from '@/features/categories/helpers';
import { useFormatMoney } from '@/features/categories/hooks';
import { CURRENCIES_MAP } from '@/features/currencies';
import { centsToAmount, formatMajorUnitsInputFromCents } from '@/features/formatting/helpers';
import { useTrendByRange } from '@/features/insights/api';
import { parseToCents } from '@/lib/data/money';
import { monthRangeOf, yearMonthOf } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { refinePositiveNumberOrNull } from '@/lib/validation/helpers';
import { monthlyFromDaily } from '../helpers';
import { useGlobalBudget, useSetGlobalBudget } from '../hooks';

const schema = z.object({
  amount: z.string().refine(refinePositiveNumberOrNull, translate('stats.global_budget_invalid')),
  type: z.enum(['monthly', 'yearly']),
});

const snapPoints = ['85%'];
const MONTHS_PER: Record<GlobalBudgetType, number> = { monthly: 1, yearly: 12 };

/** Average monthly spending over the six complete months before this one, and the sum of category budgets. */
function useSuggestions() {
  const lastMonth = yearMonthOf(monthRangeOf(new Date(), -1)[0]);
  const [start, end] = monthBarsRange(lastMonth);
  const { data: rows = [] } = useTrendByRange(start, end);
  const { data: categories = [] } = useCategories();
  return {
    average: averageOfLast(buildMonthBars(monthlyFromDaily(rows), lastMonth, 'expense'), 6),
    categories: categories.reduce((sum, c) => sum + (c.kind === 'expense' ? c.budget ?? 0 : 0), 0),
  };
}

function GlobalBudgetForm({ currentBudget, onSuccess }: { currentBudget: GlobalBudget | null; onSuccess: () => void }) {
  const setGlobalBudget = useSetGlobalBudget();
  const money = useFormatMoney();
  const currency = useAppStore.use.currency();
  const suggestions = useSuggestions();

  const form = useForm({
    defaultValues: {
      type: currentBudget?.type ?? 'monthly' as GlobalBudgetType,
      amount: currentBudget?.amountCents ? String(centsToAmount(currentBudget.amountCents)) : '',
    },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const cents = parseToCents(value.amount);
      await setGlobalBudget.mutateAsync(cents ? { amountCents: cents, type: value.type } : null);
      onSuccess();
    },
  });
  const type = useStore(form.store, (s) => s.values.type);
  const amount = parseToCents(useStore(form.store, (s) => s.values.amount)) ?? 0;
  const months = MONTHS_PER[type];
  const assigned = suggestions.categories * months;
  const chips = [
    suggestions.average > 0 && { label: translate('stats.six_month_avg', { amount: money(suggestions.average * months, 0) }), cents: suggestions.average * months },
    assigned > 0 && { label: translate('stats.categories_total', { amount: money(assigned, 0) }), cents: assigned },
  ].filter((chip) => !!chip);

  return (
    <View className="px-5 pb-6">
      <Text className="text-sm text-muted-foreground">{translate('stats.overall_budget_hint')}</Text>
      <form.Field
        name="type"
        children={(field) => (
          <SegmentedControl
            className="mt-5 self-center"
            fill={false}
            options={[
              { value: 'monthly', label: translate('stats.global_budget_type_monthly') },
              { value: 'yearly', label: translate('stats.global_budget_type_yearly') },
            ]}
            value={field.state.value}
            onChange={field.handleChange}
            accessibilityLabel={translate('stats.global_budget_type_label')}
          />
        )}
      />
      <form.Field
        name="amount"
        children={(field) => {
          const error = getFieldError(field);
          return (
            <>
              <View className="flex-row items-baseline justify-center gap-0.5 pt-5.5">
                <Text className="text-[28px] font-semibold text-muted-foreground">{CURRENCIES_MAP[currency].symbol}</Text>
                <Input
                  sheet
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  accessibilityLabel={translate(type === 'yearly' ? 'stats.yearly_budget' : 'stats.monthly_budget')}
                  accessibilityHint={error}
                  containerClassName="min-w-[120px] shrink"
                  className="h-auto rounded-none border-0 bg-transparent px-0 text-center text-[56px] font-bold tracking-tighter tabular-nums web:field-sizing-content"
                />
              </View>
              {!!error && <Text className="mt-1 text-center text-meta text-negative">{error}</Text>}
              {chips.length > 0 && (
                <View className="flex-row flex-wrap justify-center gap-2 pt-4.5">
                  {chips.map((chip) => (
                    <Pressable
                      key={chip.label}
                      accessibilityRole="button"
                      onPress={() => field.handleChange(formatMajorUnitsInputFromCents(chip.cents))}
                      className="h-9 justify-center rounded-full bg-card-2 px-3.5"
                    >
                      <Text className="text-meta font-medium">{chip.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          );
        }}
      />
      {amount > 0 && assigned > 0 && (
        <View className="mt-5.5 gap-2 rounded-[18px] bg-card-2 px-4 py-3.5">
          <View className="h-2 flex-row gap-0.5 overflow-hidden rounded-full">
            <View className="bg-accent" style={{ flex: Math.min(assigned, amount) }} />
            {amount > assigned && <View className="bg-track" style={{ flex: amount - assigned }} />}
          </View>
          <View className="flex-row justify-between gap-2">
            <Text className="text-meta text-muted-foreground tabular-nums">{translate('stats.in_category_budgets', { amount: money(assigned, 0) })}</Text>
            <Text className={amount >= assigned ? 'text-meta text-muted-foreground tabular-nums' : 'text-meta text-negative tabular-nums'}>
              {amount >= assigned
                ? translate('stats.free_amount', { amount: money(amount - assigned, 0) })
                : translate('stats.over_amount', { amount: money(assigned - amount, 0) })}
            </Text>
          </View>
        </View>
      )}
      <SolidButton
        className="mt-5.5"
        color="primary"
        size="lg"
        fullWidth
        label={translate('stats.save_budget')}
        onPress={form.handleSubmit}
        loading={setGlobalBudget.isPending}
      />
    </View>
  );
}

export function BudgetSheet({ ref }: { ref: React.RefObject<BottomSheetModal<any> | null> }) {
  const { data: currentBudget = null, isLoading } = useGlobalBudget();
  const close = React.useCallback(() => ref.current?.close(), [ref]);

  return (
    <ModalSheet ref={ref} title={translate('stats.overall_budget')} snapPoints={snapPoints}>
      <BottomSheetScrollView style={defaultStyles.transparentBg} keyboardShouldPersistTaps="handled">
        {!isLoading && <GlobalBudgetForm key={JSON.stringify(currentBudget)} currentBudget={currentBudget} onSuccess={close} />}
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

/* eslint-disable react-refresh/only-export-components */
import type { BudgetOverviewItem } from './types';
import * as React from 'react';

import { ScrollView, View } from 'react-native';
import { getPressedStyle, Pressable, Text } from '@/components/ui';

import { useCategories, useUpdateCategory } from '@/features/categories/api';
import { centsToAmount, formatCurrency, formatMajorUnitsInputFromCents } from '@/features/formatting/helpers';

import { translate } from '@/lib/i18n';

import { useAppStore } from '@/lib/store/store';

type RecommendationCardProps = {
  categoryId: string;
  categoryName: string;
  suggestedCents: number;
  onDismiss: (id: string) => void;
};

function RecommendationCard({ categoryId, categoryName, suggestedCents, onDismiss }: RecommendationCardProps) {
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const updateCategory = useUpdateCategory();
  const { data: categories = [] } = useCategories();

  const handleApply = () => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    updateCategory.mutate({
      id: categoryId,
      data: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        budget: formatMajorUnitsInputFromCents(suggestedCents),
        budget_rollover: cat.budget_rollover,
        budget_alert_threshold: cat.budget_alert_threshold != null ? String(cat.budget_alert_threshold) : null,
      },
    });
    onDismiss(categoryId);
  };

  const formattedAmount = formatCurrency(centsToAmount(suggestedCents), currency, numberFormat, currencyFormat);

  return (
    <View className="mr-3 w-64 gap-3 rounded-2xl bg-warning-500/10 p-4">
      <View>
        <Text className="text-sm font-semibold text-foreground">
          {translate('budgets.suggestion_title', { name: categoryName } as never)}
        </Text>
        <Text className="mt-1 text-xs text-muted-foreground">
          {translate('budgets.suggestion_description', { amount: formattedAmount } as never)}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          className="flex-1 items-center rounded-lg bg-warning-500 py-1.5"
          style={getPressedStyle}
          onPress={handleApply}
        >
          <Text className="text-xs font-semibold text-white">{translate('budgets.apply')}</Text>
        </Pressable>
        <Pressable
          className="flex-1 items-center rounded-lg bg-muted py-1.5"
          style={getPressedStyle}
          onPress={() => onDismiss(categoryId)}
        >
          <Text className="text-xs font-semibold text-muted-foreground">{translate('budgets.dismiss')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export type BudgetRecommendation = {
  category_id: string;
  category_name: string;
  suggested_cents: number;
};

type Props = {
  recommendations: BudgetRecommendation[];
  onDismiss: (categoryId: string) => void;
};

export function BudgetRecommendations({ recommendations, onDismiss }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="mb-2 px-4 text-sm font-medium text-muted-foreground">Suggestions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.category_id}
            categoryId={rec.category_id}
            categoryName={rec.category_name}
            suggestedCents={rec.suggested_cents}
            onDismiss={onDismiss}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Compute rule-based recommendations from monthly history data.
 * Returns a recommendation if a category is over budget in 3+ of the last 6 months.
 */
export function computeRecommendations(
  items: BudgetOverviewItem[],
  histories: { categoryId: string; yearMonth: number; budget: number; spent: number }[],
): BudgetRecommendation[] {
  const recs: BudgetRecommendation[] = [];

  for (const item of items) {
    const catHistory = histories.filter((h) => h.categoryId === item.category_id);
    if (catHistory.length < 3) continue;

    const overBudgetMonths = catHistory.filter((h) => h.budget > 0 && h.spent > h.budget);
    if (overBudgetMonths.length < 3) continue;

    const avgSpent = catHistory.reduce((s, h) => s + h.spent, 0) / catHistory.length;
    const suggested = Math.ceil(avgSpent * 1.05 / 100) * 100; // round up to nearest 100 cents

    recs.push({
      category_id: item.category_id,
      category_name: item.category_name,
      suggested_cents: suggested,
    });
  }

  return recs;
}

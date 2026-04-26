import type { CurrencyKey } from '@/features/currencies';
import type { CategoryBudgetRow } from '@/features/notifications/queries';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable } from 'react-native';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { FormattedCurrency, Text, View } from '@/components/ui';
import { CircleDollarSign } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { hexWithOpacity } from '@/lib/theme/colors';
import { BudgetProgressBar } from '../../../components/ui/budget-progress-bar';

type Props = {
  categories: CategoryBudgetRow[];
  currency: CurrencyKey;
};

export function BudgetCategoryList({ categories, currency }: Props) {
  const router = useRouter();

  if (categories.length === 0) {
    return (
      <View className="items-center gap-4 rounded-2xl bg-card px-6 py-10">
        <CircleDollarSign size={48} className="text-muted-foreground opacity-80" />
        <Text className="text-center text-sm text-muted-foreground">
          {translate('stats.budget_no_categories')}
        </Text>
        <Pressable
          className="rounded-full bg-muted px-4 py-2"
          onPress={() => router.push('/categories')}
        >
          <Text className="text-sm font-medium text-foreground">
            {translate('stats.budget_go_to_categories')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View className="mb-2 px-1">
        <Text className="font-medium text-muted-foreground">
          {translate('common.categories')}
        </Text>
      </View>

      <View className="overflow-hidden rounded-xl bg-card py-1 2xs:py-2">
        {categories.map((category) => {
          const ratio = category.budget > 0 ? category.spent / category.budget : 0;
          const isOver = ratio >= 1;

          return (
            <View key={category.id}>
              <View className="flex-row items-center gap-3 p-3 2xs:px-4">
                <View
                  className="size-9 items-center justify-center rounded-lg 2xs:size-10"
                  style={{ backgroundColor: hexWithOpacity(category.color ?? DEFAULT_COLOR, 36) }}
                >
                  <Text className="text-xl">
                    {category.icon?.trim() || category.name.charAt(0).toUpperCase()}
                  </Text>
                  {isOver && (
                    <View className="absolute -top-1 -right-1 size-3 rounded-full bg-danger-500" />
                  )}
                </View>
                <View className="flex-1 gap-1">
                  <View className="flex-1 flex-row items-center justify-between">
                    <View className="mr-3 flex-1 flex-row items-center gap-2.5">
                      <Text
                        className="flex-1 text-sm font-medium text-foreground"
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </View>
                    <View className="flex-row items-baseline gap-0.5">
                      <FormattedCurrency
                        value={category.spent}
                        currency={currency}
                        className="text-sm font-medium text-foreground"
                      />
                      <Text className="text-sm text-muted-foreground">/</Text>
                      <FormattedCurrency
                        value={category.budget}
                        currency={currency}
                        className="text-sm text-muted-foreground"
                      />
                    </View>
                  </View>
                  <View>
                    <BudgetProgressBar
                      spent={category.spent}
                      budget={category.budget}
                      showPercentage={true}
                      bg="bg-muted"
                    />
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

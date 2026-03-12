import { format } from 'date-fns';
import * as React from 'react';

import { View } from 'react-native';
import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';
import { useCategorySpend } from '@/features/insights/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

export function CategoriesScreen() {
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const { data = [] } = useCategorySpend(currentMonth);
  const currency = useAppStore.use.currency();

  const totalSpent = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="mb-4 text-lg font-medium">
          {translate('common.categories')}
        </Text>

        {data.length === 0
          ? (
              <Text className="text-sm text-neutral-500">
                {translate('home.add_category_description')}
              </Text>
            )
          : (
              <View className="mb-4 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                <View className="mb-4 flex-row items-baseline justify-between">
                  <Text className="text-sm text-neutral-500">
                    {translate('insights.spending_by_category')}
                  </Text>
                  <Text className="text-sm font-medium">
                    {formatCurrency(totalSpent, currency)}
                  </Text>
                </View>

                {data.map((item) => {
                  const percentage = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;

                  return (
                    <View
                      key={item.category_id}
                      className="mb-3 flex-row items-center gap-3"
                    >
                      <View
                        className="size-9 items-center justify-center rounded-full"
                        style={{ backgroundColor: item.category_color }}
                      >
                        <Text className="text-lg">{item.category_icon}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-baseline justify-between">
                          <Text className="text-sm font-medium">
                            {item.category_name}
                          </Text>
                          <Text className="text-sm font-medium">
                            {formatCurrency(item.total, currency)}
                          </Text>
                        </View>
                        <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                          <View
                            className="h-full rounded-full bg-primary-400"
                            style={{ width: `${percentage}%` }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
      </ScrollView>
    </View>
  );
}

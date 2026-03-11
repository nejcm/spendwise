import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { formatCurrency } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { useCategorySpend } from '../insights/api';

export function SpendingByCategory() {
  const router = useRouter();
  const currentMonth = React.useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const { data = [] } = useCategorySpend(currentMonth);
  const currency = useAppStore.use.currency();

  return (
    <View>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-lg font-semibold">{translate('common.categories')}</Text>
        <Pressable onPress={() => router.push('/categories')}>
          <Text className="text-sm font-semibold text-neutral-500">{translate('common.seeAll')}</Text>
        </Pressable>
      </View>

      {data.length === 0
        ? (
            <View>
              <Pressable
                onPress={() => router.push('/settings/categories')}
                className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <View className="flex-row items-center">
                  <Plus className="mr-2 size-5 text-foreground" />
                  <Text className="text-sm font-semibold text-foreground">{translate('home.add_category')}</Text>
                </View>
                <Text className="mt-2 text-xs text-neutral-500">
                  {translate('home.add_category_description')}
                </Text>
              </Pressable>
            </View>
          )
        : (
            <View className="flex-3 flex-row flex-wrap gap-2">
              {data.slice(0, 3).map((item) => (
                <View
                  key={item.category_id}
                  className="flex-1 rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900"
                >
                  <Text className="text-2xl font-medium">{item.category_icon}</Text>
                  <Text className="mt-2 text-xs font-medium text-neutral-500">{item.category_name}</Text>
                  <Text className="mt-1 text-base font-semibold">
                    {formatCurrency(item.total, currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}

    </View>
  );
}

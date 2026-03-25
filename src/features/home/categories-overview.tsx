import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { ScrollView, View } from 'react-native';
import { FormattedCurrency, Text } from '@/components/ui';
import { GhostButton } from '@/components/ui/ghost-button';
import { SkeletonRows } from '@/components/ui/skeleton';
import { getCurrentMonthRange } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { NoDataCard } from '../../components/no-data-card';
import { useCategorySpendByRange } from '../insights/api';

export const CategoriesOverview = React.memo(() => {
  const router = useRouter();
  const [startDate, endDate] = React.useMemo(() => getCurrentMonthRange(format(new Date(), 'yyyy-MM')), []);
  const { data = [], isLoading } = useCategorySpendByRange(startDate, endDate);
  const currency = useAppStore.use.currency();
  const visibleCategories = React.useMemo(() => data.filter((item) => item.total > 0), [data]);
  const hasCategories = visibleCategories.length > 0;

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-lg font-medium">{translate('common.categories')}</Text>
        {hasCategories && (
          <GhostButton size="sm" className="px-0" onPress={() => router.push('/categories')}>
            <Text className="text-sm font-medium text-muted-foreground">{translate('common.seeAll')}</Text>
          </GhostButton>
        )}
      </View>
      {hasCategories
        ? (
            <ScrollView
              style={defaultStyles.transparentBg}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <View className="flex-row gap-2">
                {visibleCategories.map((item) => (
                  <View
                    key={item.category_id}
                    className="w-34 rounded-xl bg-card px-3 py-2"
                  >
                    <Text className="text-2xl">{item.category_icon || '?'}</Text>
                    <Text className="mt-2 text-xs font-medium text-muted-foreground" numberOfLines={1}>{item.category_name}</Text>
                    <FormattedCurrency value={item.total} currency={currency} className="mt-1 text-base font-medium" />
                  </View>
                ))}
              </View>
            </ScrollView>
          )
        : isLoading
          ? <SkeletonRows count={3} />
          : <NoDataCard onPress={() => router.push('/categories')} label={translate('home.add_category')} description={translate('home.add_category_description')} />}
    </View>
  );
});

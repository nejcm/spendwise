import type { CategorySpend, CategoryType } from '@/features/insights/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { HeaderButton } from '@/components/page-header';
import { PeriodPill } from '@/components/period-pill';
import { FocusAwareStatusBar, SegmentedControl, Text } from '@/components/ui';
import { BUDGET_STATE_CLASSES, getBudgetState } from '@/components/ui/budget-state';
import { Pencil } from '@/components/ui/icon';
import { SkeletonGrid } from '@/components/ui/skeleton';
import { categorySpendByRangeQueryOptions, useCategorySpendByRange } from '@/features/insights/api';
import { cn } from '@/lib/cn';
import { usePrefetchAdjacentPeriods } from '@/lib/data/prefetch';
import { scaleBudgetForPeriod } from '@/lib/date/helpers';
import { getPeriodLabel } from '@/lib/date/labels';
import { usePeriodRange } from '@/lib/hooks/use-current-year-month';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { CategoriesEditList } from './components/categories-edit-list';
import { CategoryTile, NewCategoryTile } from './components/category-tile';
import { amountFor, inKindTab, periodMonthName, translateCount } from './helpers';
import { useFormatMoney } from './hooks';

export function CategoriesScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  return edit === 'true' || edit === '1' ? <CategoriesEditList /> : <CategoriesOverview />;
}

function CategoriesOverview() {
  const router = useRouter();
  const db = useSQLiteContext();
  const format = useFormatMoney();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = usePeriodRange(selection);
  const { data = [], isLoading } = useCategorySpendByRange(startDate, endDate);
  const { refreshing, onRefresh } = useRefresh();
  const [kind, setKind] = React.useState<CategoryType>('expense');
  usePrefetchAdjacentPeriods(selection, (start, end) => categorySpendByRangeQueryOptions(db, start, end));

  const tabs = React.useMemo(() => {
    const byKind = (k: CategoryType) => data.filter((item) => inKindTab(k, item));
    return { expense: byKind('expense'), income: byKind('income') };
  }, [data]);
  const items = tabs[kind];
  const budgetFor = (item: CategorySpend) =>
    kind === 'expense' && item.category_budget ? scaleBudgetForPeriod(item.category_budget, selection) : undefined;
  const total = items.reduce((sum, item) => sum + amountFor(kind, item), 0);
  const overCount = kind === 'expense' ? items.filter((item) => getBudgetState(item.expense_total, budgetFor(item)) === 'over').length : 0;
  const month = periodMonthName(selection, startDate);
  const summaryKey = kind === 'income'
    ? (month ? 'categories.summary_earned_in' : 'categories.summary_earned')
    : (month ? 'categories.summary_spent_in' : 'categories.summary_spent');
  const summary = translate(summaryKey, { amount: format(total), period: month ?? getPeriodLabel(selection) });

  const cells: (CategorySpend | 'new')[] = [...items, 'new'];
  const rows = Array.from({ length: Math.ceil(cells.length / 2) }, (_, i) => cells.slice(i * 2, i * 2 + 2));

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1"
        style={defaultStyles.transparentBg}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-wash to-background" />
        <View className="px-5 pt-2 pb-6">
          <View className="h-12 flex-row items-center gap-2">
            <Text accessibilityRole="header" className="flex-1 text-page-title font-bold tracking-page-title" numberOfLines={1}>
              {translate('categories.title')}
            </Text>
            <PeriodPill selection={selection} />
            <HeaderButton
              icon={Pencil}
              label={translate('categories.edit_title')}
              onPress={() => router.navigate({ pathname: '/categories', params: { edit: 'true' } })}
            />
          </View>
          <Text className="mt-1 text-row text-muted-foreground">
            {summary}
            {overCount > 0 && (
              <Text className={cn('text-row font-medium', BUDGET_STATE_CLASSES.over.text)}>
                {` · ${translateCount('categories.over_budget_count', overCount)}`}
              </Text>
            )}
          </Text>
          <SegmentedControl
            className="mt-4"
            fill={false}
            value={kind}
            onChange={setKind}
            accessibilityLabel={translate('categories.kind')}
            options={[
              { value: 'expense', label: `${translate('categories.kind_expense')} ${tabs.expense.length}` },
              { value: 'income', label: `${translate('categories.kind_income')} ${tabs.income.length}` },
            ]}
          />
          {isLoading
            ? <SkeletonGrid className="mt-4" cols={2} rows={3} />
            : (
                <View className="mt-4 gap-2">
                  {rows.map((row) => (
                    <View key={row.map((cell) => cell === 'new' ? cell : cell.category_id).join()} className="flex-row gap-2">
                      {row.map((cell) => cell === 'new'
                        ? <NewCategoryTile key="new" onPress={() => router.push('/categories/new')} />
                        : (
                            <CategoryTile
                              key={cell.category_id}
                              item={cell}
                              kind={kind}
                              budget={budgetFor(cell)}
                              onPress={() => router.push({ pathname: '/categories/[id]', params: { id: cell.category_id, kind } })}
                            />
                          ))}
                      {row.length === 1 && <View className="flex-1" />}
                    </View>
                  ))}
                </View>
              )}
          {kind === 'expense' && <BudgetLegend />}
        </View>
      </ScrollView>
    </>
  );
}

function BudgetLegend() {
  const entries = [
    { label: translate('categories.legend_used'), dot: BUDGET_STATE_CLASSES.normal.bar },
    { label: translate('categories.legend_warning'), dot: BUDGET_STATE_CLASSES.warning.bar },
    { label: translate('categories.legend_over'), dot: BUDGET_STATE_CLASSES.over.bar },
  ];
  return (
    <View className="mt-4 flex-row flex-wrap justify-center gap-x-4 gap-y-1">
      {entries.map((entry) => (
        <View key={entry.label} className="flex-row items-center gap-1.5">
          <View className={cn('size-2 rounded-full', entry.dot)} />
          <Text className="text-meta text-muted-foreground">{entry.label}</Text>
        </View>
      ))}
    </View>
  );
}

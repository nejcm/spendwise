import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { PeriodSelector } from '@/components/period-selector';
import ScreenHeader from '@/components/screen-header';
import { Card, FocusAwareStatusBar, FormattedCurrency, GhostButton, IconButton, Pencil, PlusIcon, SectionHeader, SolidButton, Text } from '@/components/ui';
import { BudgetProgressBar } from '@/components/ui/budget-progress-bar';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useCategorySpendByRange } from '@/features/insights/api';
import { useTransactions } from '@/features/transactions/api';
import { TransactionList } from '@/features/transactions/components/transaction-list';
import { TransactionSelectionToolbar } from '@/features/transactions/components/transaction-selection-toolbar';
import { useTransactionSelection } from '@/features/transactions/hooks/selection';
import { buildTransactionsHref } from '@/features/transactions/route-params';
import { queryKeys } from '@/lib/data/query-keys';
import { getPeriodRange, scaleBudgetForPeriod } from '@/lib/date/helpers';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';

export function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = useMemo(() => getPeriodRange(selection), [selection]);
  const refreshKeys = useMemo(() => [
    queryKeys.insights.categorySpendRange(startDate, endDate),
    queryKeys.transactions.list(`${startDate}/${endDate}`),
  ] as const, [endDate, startDate]);
  const { refreshing, onRefresh } = useRefresh(refreshKeys);

  const { data: categories = [], isLoading: categoriesLoading } = useCategorySpendByRange(startDate, endDate);
  const category = useMemo(() => categories.find((c) => c.category_id === id), [categories, id]);

  const { data: allTransactions = [], isLoading: txLoading } = useTransactions(startDate, endDate);
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.category_id === id),
    [allTransactions, id],
  );
  const {
    selectionMode,
    selectedIds,
    selectedCount,
    toggleSelection,
    startSelection,
    clearSelection,
    deleteSelected,
  } = useTransactionSelection(transactions);

  if (categoriesLoading) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('categories.title')} backHref="/categories" />
        <View className="flex-1 px-4 py-10">
          <SkeletonRows count={4} />
        </View>
      </>
    );
  }

  if (!category) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('categories.title')} backHref="/categories" />
        <View className="flex-1 items-center justify-center gap-4 px-4">
          <Text className="text-center text-muted-foreground">{translate('categories.not_found')}</Text>
          <GhostButton color="secondary" label={translate('common.back')} onPress={() => goBackOrFallback(router, '/categories')} />
        </View>
      </>
    );
  }

  const monthlyBudget = category.category_budget ?? 0;
  const scaledBudget = monthlyBudget > 0 ? scaleBudgetForPeriod(monthlyBudget, selection) : undefined;

  return (
    <>
      <FocusAwareStatusBar />
      <ScreenHeader title={`${category.category_icon ?? ''} ${category.category_name}`.trim()} backHref="/categories">
        <IconButton
          size="sm"
          color="none"
          className="-mr-2 ml-auto"
          accessibilityLabel={translate('common.edit')}
          onPress={() => router.push({ pathname: '/categories/[id]/edit', params: { id: category.category_id } })}
        >
          <Pencil size={16} colorClassName="accent-muted-foreground" />
        </IconButton>
      </ScreenHeader>

      <PeriodSelector selection={selection} />

      <View className="flex-1">
        <ScrollView
          className="flex-1"
          style={defaultStyles.transparentBg}
          contentContainerClassName="pb-24"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="px-4">
            <Card className="gap-3 p-5">
              <Text className="text-sm font-medium text-muted-foreground">{translate('categories.spent')}</Text>
              <View className="flex-row items-baseline gap-1.5">
                <FormattedCurrency value={category.expense_total} currency={currency} className="text-3xl font-bold" />
                {scaledBudget != null && (
                  <>
                    <Text className="text-sm text-muted-foreground">/</Text>
                    <FormattedCurrency value={scaledBudget} currency={currency} className="text-sm text-muted-foreground" />
                  </>
                )}
              </View>
              {scaledBudget != null && (
                <BudgetProgressBar spent={category.expense_total} budget={scaledBudget} className="h-2.5" />
              )}
              <SolidButton
                color="primary"
                className="mt-2"
                label={translate('categories.add_to', { name: category.category_name })}
                iconLeft={<PlusIcon size={16} colorClassName="accent-primary-foreground" className="mr-1" />}
                onPress={() => router.push({ pathname: '/transactions/new', params: { category_id: category.category_id } })}
              />
            </Card>

            <SectionHeader
              title={translate('transactions.title')}
              onSeeAll={() => router.push(buildTransactionsHref({ categoryId: category.category_id, periodSelection: selection }))}
            />
          </View>

          <TransactionList
            transactions={transactions}
            isLoading={txLoading}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelect={toggleSelection}
            onStartSelection={startSelection}
          />
        </ScrollView>
        {selectionMode && (
          <TransactionSelectionToolbar
            selectedCount={selectedCount}
            onClear={clearSelection}
            onDelete={deleteSelected}
          />
        )}
      </View>
    </>
  );
}

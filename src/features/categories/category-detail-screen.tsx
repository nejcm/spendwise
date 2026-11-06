import type { CategorySpend, CategoryType } from '@/features/insights/types';
import type { PeriodSelection } from '@/lib/store/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { PeriodPill } from '@/components/period-pill';
import { AmountText, Card, FocusAwareStatusBar, IconTile, SectionHeader, SolidButton, Text } from '@/components/ui';
import { BUDGET_STATE_CLASSES, getBudgetState } from '@/components/ui/budget-state';
import { ChevronLeft, Pencil, Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { formatNumber } from '@/features/formatting/helpers';
import { useCategorySpendByRange } from '@/features/insights/api';
import { useTransactions } from '@/features/transactions/api';
import { TransactionCard } from '@/features/transactions/components/transaction-card';
import { buildTransactionsHref } from '@/features/transactions/route-params';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/data/query-keys';
import { scaleBudgetForPeriod } from '@/lib/date/helpers';
import { useCurrentYearMonth, usePeriodRange } from '@/lib/hooks/use-current-year-month';
import { useRefresh } from '@/lib/hooks/use-refresh';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { MonthBars } from './components/month-bars';
import { averageOfLast, buildMonthBars, categoryIcon, categoryName, isUncategorised, monthBarsRange, periodMonthName, routeKind, translateCount } from './helpers';
import { useCategoryMonthlyTotals, useFormatMoney } from './hooks';

const RECENT_COUNT = 5;

export function CategoryDetailScreen() {
  const { id, kind: kindParam } = useLocalSearchParams<{ id: string; kind?: string }>();
  const router = useRouter();
  const selection = useAppStore.use.periodSelection();
  const [startDate, endDate] = usePeriodRange(selection);
  const refreshKeys = React.useMemo(() => [
    queryKeys.insights.all,
    queryKeys.transactions.list(`${startDate}/${endDate}`),
  ] as const, [endDate, startDate]);
  const { refreshing, onRefresh } = useRefresh(refreshKeys);

  const { data: spend = [], isLoading } = useCategorySpendByRange(startDate, endDate);
  const category = spend.find((c) => c.category_id === id);
  const kind = routeKind(kindParam, category?.category_type);
  const { data: allTransactions = [] } = useTransactions(startDate, endDate);
  const transactions = React.useMemo(
    () => allTransactions.filter((t) => t.category_id === id && t.type === kind),
    [allTransactions, id, kind],
  );

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1"
        style={defaultStyles.transparentBg}
        contentContainerStyle={{ paddingBottom: 88 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-85 bg-linear-to-b from-wash to-background" />
        <View className="px-5 pt-2">
          <PageHeader
            left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router, '/categories')} />}
            right={category && !isUncategorised(category.category_id) && (
              <HeaderButton
                icon={Pencil}
                label={translate('common.edit')}
                onPress={() => router.push({ pathname: '/categories/[id]/edit', params: { id: category.category_id } })}
              />
            )}
          >
            <PeriodPill selection={selection} />
          </PageHeader>
          {isLoading
            ? <SkeletonRows count={4} className="mt-5" />
            : !category
                ? <Text className="mt-10 text-center text-muted-foreground">{translate('categories.not_found')}</Text>
                : (
                    <>
                      <CategoryHero category={category} kind={kind} spend={spend} selection={selection} startDate={startDate} visits={transactions.length} />
                      <SixMonths category={category} kind={kind} selection={selection} startDate={startDate} />
                      <SectionHeader
                        title={translate('transactions.title')}
                        actionLabel={transactions.length > RECENT_COUNT ? translate('categories.all_count', { count: transactions.length }) : undefined}
                        onSeeAll={transactions.length > RECENT_COUNT
                          ? () => router.push(buildTransactionsHref({ categoryIds: [category.category_id], type: kind, periodSelection: selection }))
                          : undefined}
                      />
                      {transactions.length === 0
                        ? <Text className="py-6 text-center text-meta text-muted-foreground">{translate('categories.no_transactions')}</Text>
                        : transactions.slice(0, RECENT_COUNT).map((t) => <TransactionCard key={t.id} transaction={t} showDate showAccount className="px-0" />)}
                    </>
                  )}
        </View>
      </ScrollView>
      {category && (
        <View className="absolute inset-x-0 bottom-0 bg-background px-5 py-2">
          <SolidButton
            color="primary"
            size="lg"
            fullWidth
            label={translate('categories.add_to', { name: categoryName(category.category_id, category.category_name) })}
            iconLeft={<Plus size={18} colorClassName="accent-primary-foreground" />}
            onPress={() => router.push({ pathname: '/transactions/new', params: { category_id: category.category_id } })}
          />
        </View>
      )}
    </>
  );
}

type HeroProps = {
  category: CategorySpend;
  kind: CategoryType;
  spend: CategorySpend[];
  selection: PeriodSelection;
  startDate: number | undefined;
  visits: number;
};

function CategoryHero({ category, kind, spend, selection, startDate, visits }: HeroProps) {
  const format = useFormatMoney();
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const isIncome = kind === 'income';
  const amountOf = (c: CategorySpend) => isIncome ? c.income_total : c.expense_total;
  const amount = amountOf(category);
  const kindTotal = spend.reduce((sum, c) => sum + amountOf(c), 0);
  const budget = !isIncome && category.category_budget ? scaleBudgetForPeriod(category.category_budget, selection) : undefined;
  const state = getBudgetState(amount, budget);
  const month = periodMonthName(selection, startDate);
  const percent = `${formatNumber(kindTotal > 0 ? (amount / kindTotal) * 100 : 0, numberFormat, 1)}%`;
  const shareKey = isIncome
    ? (month ? 'categories.share_income_in' : 'categories.share_income')
    : (month ? 'categories.share_spending_in' : 'categories.share_spending');
  const meta = `${translateCount('categories.transactions_count', visits)} · ${translate(shareKey, { percent, period: month })}`;

  return (
    <Card variant="hero" className="mt-5 p-5">
      <View className="flex-row items-center gap-3">
        <IconTile size="lg" color={category.category_color} icon={categoryIcon(category.category_id, category.category_icon, category.category_name)} />
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-semibold" numberOfLines={1}>{categoryName(category.category_id, category.category_name)}</Text>
          <Text className="text-meta text-muted-foreground" numberOfLines={2}>{meta}</Text>
        </View>
      </View>
      <View className="mt-4 flex-row flex-wrap items-baseline gap-x-2">
        <AmountText size="hero" value={amount} currency={currency} className={cn(state === 'over' && BUDGET_STATE_CLASSES.over.text)} />
        {budget != null && <Text className="text-row text-muted-foreground">{translate('categories.of_budget', { amount: format(budget) })}</Text>}
      </View>
      {budget != null && <BudgetBar amount={amount} budget={budget} />}
    </Card>
  );
}

function BudgetBar({ amount, budget }: { amount: number; budget: number }) {
  const format = useFormatMoney();
  const state = getBudgetState(amount, budget);
  const over = state === 'over';
  return (
    <>
      <View className="mt-4 h-2.5 overflow-hidden rounded-full bg-track">
        <View className={cn('h-full rounded-full', BUDGET_STATE_CLASSES[state].bar)} style={{ width: `${over ? 100 : Math.min(100, (amount / budget) * 100)}%` }} />
        {over && <View className="absolute inset-y-0 w-0.5 bg-background" style={{ left: `${(budget / amount) * 100}%` }} />}
      </View>
      <View className="mt-2 flex-row justify-between gap-2">
        <Text className={cn('text-meta', over ? 'font-semibold text-negative' : 'text-muted-foreground')}>
          {over
            ? translate('categories.over_budget_amount', { amount: format(amount - budget) })
            : translate('categories.left_amount', { amount: format(budget - amount) })}
        </Text>
        {over && <Text className="text-meta text-muted-foreground">{translate('categories.budget_line_at', { amount: format(budget) })}</Text>}
      </View>
    </>
  );
}

function SixMonths({ category, kind, selection, startDate }: { category: CategorySpend; kind: CategoryType; selection: PeriodSelection; startDate: number | undefined }) {
  const format = useFormatMoney();
  const currentYearMonth = useCurrentYearMonth();
  const endYearMonth = periodMonthName(selection, startDate) && startDate !== undefined
    ? new Date(startDate * 1000).toISOString().slice(0, 7)
    : currentYearMonth;
  const [start, end] = monthBarsRange(endYearMonth);
  const { data: rows = [] } = useCategoryMonthlyTotals(category.category_id, start, end);
  const bars = buildMonthBars(rows, endYearMonth, kind);
  const budget = kind === 'expense' ? category.category_budget ?? undefined : undefined;

  return (
    <Card className="mt-3 p-4">
      <View className="mb-3 flex-row items-baseline justify-between gap-2">
        <Text className="text-row font-semibold">{translate('categories.last_six_months')}</Text>
        <Text className="text-meta text-muted-foreground">{translate('categories.avg_three_months', { amount: format(averageOfLast(bars)) })}</Text>
      </View>
      <MonthBars bars={bars} budget={budget} />
    </Card>
  );
}

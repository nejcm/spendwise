import type { PeriodProps } from '../types';
import type { CategorySpend } from '@/features/insights/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { AmountText, getPressedStyle, IconTile, Text, useModalSheet } from '@/components/ui';
import { BUDGET_STATE_CLASSES, getBudgetState } from '@/components/ui/budget-state';
import { categoryIcon, isUncategorised } from '@/features/categories/helpers';
import { useFormatMoney } from '@/features/categories/hooks';
import { formatNumber } from '@/features/formatting/helpers';
import { useCategorySpendByRange, useSummaryByRange } from '@/features/insights/api';
import { cn } from '@/lib/cn';
import { calendarDateToUnix, scaleBudgetForPeriod } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { daysLeftIn, paceFraction } from '../helpers';
import { useGlobalBudget } from '../hooks';
import { BudgetSheet } from './budget-sheet';

type BudgetRow = CategorySpend & { limit: number };

export function BudgetTab({ selection, startDate, endDate }: PeriodProps) {
  const router = useRouter();
  const sheet = useModalSheet();
  const { data: spend = [] } = useCategorySpendByRange(startDate, endDate);
  const scale = (amount: number, monthsPerAmount?: number) => scaleBudgetForPeriod(amount, selection, monthsPerAmount);
  const rows: BudgetRow[] = spend
    .filter((c) => c.category_type === 'expense' && c.category_budget)
    .map((c) => ({ ...c, limit: scale(c.category_budget!) ?? 0 }))
    .filter((c) => c.limit > 0)
    .sort((a, b) => b.expense_total / b.limit - a.expense_total / a.limit);
  const unset = spend.filter((c) => c.category_type === 'expense' && !c.category_budget && !isUncategorised(c.category_id));
  const assigned = rows.reduce((sum, c) => sum + c.limit, 0);
  const hasPeriodBudgets = scale(1) !== undefined;

  return (
    <>
      {hasPeriodBudgets
        ? <OverallCard startDate={startDate} endDate={endDate} scale={scale} assigned={assigned} onEdit={() => sheet.present()} />
        : <Text className="mt-6 text-center text-meta text-muted-foreground">{translate('stats.budget_needs_period')}</Text>}
      <View className="flex-row items-baseline justify-between pt-5.5">
        <Text accessibilityRole="header" className="text-header-title font-semibold">{translate('stats.by_category')}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/categories')} hitSlop={8}>
          <Text className="text-sm text-muted-foreground">{translate('stats.manage_categories')}</Text>
        </Pressable>
      </View>
      {hasPeriodBudgets && rows.length > 0
        ? (
            <View className="gap-2 pt-3.5">
              {rows.map((row) => (
                <CategoryBudgetRow
                  key={row.category_id}
                  row={row}
                  onPress={() => router.push({ pathname: '/categories/[id]', params: { id: row.category_id, kind: 'expense' } })}
                />
              ))}
            </View>
          )
        : <Text className="py-6 text-center text-meta text-muted-foreground">{translate('stats.budget_no_categories')}</Text>}
      {unset.length > 0 && (
        <>
          <Text accessibilityRole="header" className="pt-4.5 pb-2 text-row font-semibold">{translate('stats.no_budget_yet')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {unset.map((c) => (
              <Pressable
                key={c.category_id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/categories/[id]/edit', params: { id: c.category_id } })}
                style={getPressedStyle}
                className="h-10 flex-row items-center gap-2 rounded-full bg-card pr-3.5 pl-2.5"
              >
                <Text className="text-sm font-medium">{`${categoryIcon(c.category_id, c.category_icon, c.category_name)} ${c.category_name}`}</Text>
                <Text className="text-sm text-muted-foreground">{`· ${translate('stats.set_budget')}`}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      <BudgetSheet ref={sheet.ref} />
    </>
  );
}

type OverallProps = Pick<PeriodProps, 'startDate' | 'endDate'> & {
  scale: (amount: number, monthsPerAmount?: number) => number | undefined;
  assigned: number;
  onEdit: () => void;
};

function OverallCard({ startDate, endDate, scale, assigned, onEdit }: OverallProps) {
  const format = useFormatMoney();
  const currency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const { data: budget } = useGlobalBudget();
  const { data: summary } = useSummaryByRange(startDate, endDate);
  const today = calendarDateToUnix(new Date());

  if (!budget?.amountCents) {
    return (
      <Pressable accessibilityRole="button" onPress={onEdit} style={getPressedStyle} className="mt-4 flex-row items-center gap-3 rounded-hero bg-card p-5">
        <View className="flex-1 gap-1">
          <Text className="text-row font-semibold">{translate('stats.overall_budget')}</Text>
          <Text className="text-meta text-muted-foreground">{translate('stats.global_budget_prompt')}</Text>
        </View>
        <Text className="rounded-full bg-card-2 px-2.5 py-1 text-meta font-medium">{translate('stats.set_budget')}</Text>
      </Pressable>
    );
  }

  const limit = scale(budget.amountCents, budget.type === 'yearly' ? 12 : 1) ?? 0;
  const spent = summary?.expense ?? 0;
  const state = getBudgetState(spent, limit);
  const over = state === 'over';
  const pace = paceFraction(startDate, endDate, today);
  const daysLeft = daysLeftIn(startDate, endDate, today);
  const ends = daysLeft === null
    ? null
    : daysLeft === 0 ? translate('home.budget.ends_today') : daysLeft === 1 ? translate('home.budget.ends_tomorrow') : translate('home.budget.days_left', { count: daysLeft + 1 });
  const title = translate(budget.type === 'yearly' ? 'stats.yearly_budget' : 'stats.monthly_budget');
  const unassigned = limit - assigned;

  return (
    <Pressable accessibilityRole="button" onPress={onEdit} style={getPressedStyle} className="mt-4 gap-3 rounded-hero bg-card p-5">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="shrink text-sm text-muted-foreground" numberOfLines={1}>{ends ? `${title} · ${ends.toLowerCase()}` : title}</Text>
        <Text className="rounded-full bg-card-2 px-2.5 py-1 text-meta font-medium">{translate('common.edit')}</Text>
      </View>
      <View className="flex-row flex-wrap items-baseline gap-x-2">
        <AmountText size="hero" value={Math.abs(limit - spent)} currency={currency} className={cn(over && BUDGET_STATE_CLASSES.over.text)} />
        <Text className={cn('text-row', over ? 'text-negative' : 'text-muted-foreground')}>
          {translate(over ? 'stats.over_of' : 'stats.left_of', { amount: format(limit) })}
        </Text>
      </View>
      <View className="h-2.5 rounded-full bg-track">
        <View className={cn('h-full rounded-full', BUDGET_STATE_CLASSES[state].bar)} style={{ width: `${Math.min(100, (spent / limit) * 100)}%` }} />
        {pace !== null && (
          <View
            accessibilityLabel={translate('stats.pace_marker')}
            className="absolute -top-1 h-4.5 w-0.5 rounded-sm bg-foreground"
            style={{ left: `${Math.min(100, pace * 100)}%`, marginLeft: -2 }}
          />
        )}
      </View>
      <View className="flex-row justify-between gap-2">
        <Text className="text-meta text-muted-foreground tabular-nums">
          {translate('stats.spent_percent', { amount: format(spent), percent: `${formatNumber((spent / limit) * 100, numberFormat, 0)}%` })}
        </Text>
        {unassigned > 0 && <Text className="text-meta text-muted-foreground tabular-nums">{translate('stats.unassigned', { amount: format(unassigned, 0) })}</Text>}
      </View>
    </Pressable>
  );
}

function CategoryBudgetRow({ row, onPress }: { row: BudgetRow; onPress: () => void }) {
  const format = useFormatMoney();
  const spent = row.expense_total;
  const state = getBudgetState(spent, row.limit);
  const status = state === 'over'
    ? translate('stats.over_amount', { amount: format(spent - row.limit) })
    : spent === row.limit ? translate('stats.paid_in_full') : translate('categories.left_amount', { amount: format(row.limit - spent) });

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={getPressedStyle} className="gap-2.25 rounded-[18px] bg-card px-4 py-3">
      <View className="flex-row items-center gap-3">
        <IconTile size="sm" color={row.category_color} icon={categoryIcon(row.category_id, row.category_icon, row.category_name)} />
        <View className="min-w-0 flex-1">
          <Text className="text-row font-semibold" numberOfLines={1}>{row.category_name}</Text>
          <Text className="text-meta text-muted-foreground tabular-nums" numberOfLines={1}>{translate('home.budget.of', { spent: format(spent), budget: format(row.limit) })}</Text>
        </View>
        <Text className={cn('text-sm font-semibold tabular-nums', state === 'normal' ? 'text-muted-foreground' : BUDGET_STATE_CLASSES[state].text)}>{status}</Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-track">
        <View className={cn('h-full rounded-full', BUDGET_STATE_CLASSES[state].bar)} style={{ width: `${Math.min(100, (spent / row.limit) * 100)}%` }} />
      </View>
    </Pressable>
  );
}

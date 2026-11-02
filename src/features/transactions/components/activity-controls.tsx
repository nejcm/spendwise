import type { ActiveFilterChip } from '../filters';
import type { TransactionSort, TransactionType } from '../types';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { FilterChip, FormattedCurrency, getPressedStyle, Text } from '@/components/ui';
import { ArrowDownUp, ListFilter, Search, X } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { easeOut } from '@/lib/theme/motion';

export function SearchRow({ search, onChangeSearch, filterCount, onOpenFilters }: {
  search: string;
  onChangeSearch: (value: string) => void;
  filterCount: number;
  onOpenFilters: () => void;
}) {
  const active = filterCount > 0;
  return (
    <View className="flex-row gap-2.5 pt-4">
      <View className="h-12 min-w-0 flex-1 flex-row items-center gap-2.5 rounded-full bg-card pr-2 pl-4">
        <Search size={20} colorClassName="accent-muted-foreground" />
        <TextInput
          value={search}
          onChangeText={onChangeSearch}
          placeholder={translate('transactions.search')}
          placeholderTextColorClassName="accent-muted-foreground"
          accessibilityLabel={translate('transactions.search')}
          returnKeyType="search"
          className="min-w-0 flex-1 font-sans text-row text-foreground web:outline-none"
        />
        {search.length > 0 && (
          <Pressable onPress={() => onChangeSearch('')} hitSlop={8} accessibilityRole="button" accessibilityLabel={translate('common.clear')} className="p-1">
            <X size={18} colorClassName="accent-muted-foreground" />
          </Pressable>
        )}
      </View>
      <Pressable
        onPress={onOpenFilters}
        style={getPressedStyle}
        accessibilityRole="button"
        accessibilityLabel={filterCount === 0
          ? translate('transactions.filter.button_none')
          : filterCount === 1 ? translate('transactions.filter.button_one') : translate('transactions.filter.button_many', { count: filterCount })}
        className={cn('size-12 items-center justify-center rounded-full', active ? 'bg-primary' : 'bg-card')}
      >
        <ListFilter size={20} colorClassName={active ? 'accent-primary-foreground' : 'accent-foreground'} />
        {active && (
          <View className="absolute -top-0.5 -right-0.5 h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-accent px-1 dark:bg-foreground">
            <Text className="text-[11px] leading-none font-bold text-white dark:text-background">{filterCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

function SummaryCell({ label, value, prefix, className, first }: { label: string; value: number; prefix?: string; className?: string; first?: boolean }) {
  const currency = useAppStore.use.currency();
  return (
    <View className={cn('min-w-0 flex-1 px-3', !first && 'border-l border-border')}>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <FormattedCurrency value={value} currency={currency} prefix={prefix} shorten fractionDigits={Math.abs(value) >= 100_000 ? 1 : 2} numberOfLines={1} adjustsFontSizeToFit className={cn('text-base font-semibold', className)} />
    </View>
  );
}

export function InOutNetCard({ income, expense, net }: { income: number; expense: number; net: number }) {
  return (
    <View className="mt-4 flex-row rounded-card bg-card py-3.5">
      <SummaryCell first label={translate('transactions.in')} value={income} prefix={income > 0 ? '+' : ''} className={income > 0 ? 'text-positive' : undefined} />
      <SummaryCell label={translate('transactions.out')} value={expense ? -expense : 0} />
      <SummaryCell label={translate('common.net')} value={net} prefix={net > 0 ? '+' : ''} />
    </View>
  );
}

export function TypeTabs({ value, onChange }: { value: TransactionType | null; onChange: (type: TransactionType | null) => void }) {
  const tabs: { value: TransactionType | null; label: string }[] = [
    { value: null, label: translate('transactions.all') },
    { value: 'expense', label: translate('transactions.expenses') },
    { value: 'income', label: translate('common.income') },
    { value: 'transfer', label: translate('transactions.transfers') },
  ];
  return (
    <View accessibilityRole="tablist" accessibilityLabel={translate('transactions.type_tabs')} className="flex-row flex-wrap gap-2 pt-4">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Pressable
            key={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.value)}
            style={getPressedStyle}
            className={cn('h-9 justify-center rounded-full px-3.5', selected ? 'bg-primary' : 'bg-card')}
          >
            <Text className={cn('text-sm font-medium', selected ? 'text-primary-foreground' : 'text-foreground')}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const chipExiting = FadeOut.duration(150);
const chipLayout = LinearTransition.duration(200).easing(easeOut);

export function ActiveFilters({ chips, onRemove, onClearAll }: {
  chips: ActiveFilterChip[];
  onRemove: (chip: ActiveFilterChip) => void;
  onClearAll: () => void;
}) {
  return (
    <View className="flex-row flex-wrap items-center gap-1.5 pt-3">
      {chips.map((chip) => (
        <Animated.View key={chip.key} exiting={chipExiting} layout={chipLayout}>
          <FilterChip label={chip.label} icon={chip.icon ?? undefined} onRemove={() => onRemove(chip)} />
        </Animated.View>
      ))}
      <Animated.View layout={chipLayout}>
        <Pressable onPress={onClearAll} hitSlop={6} accessibilityRole="button" className="h-8.5 justify-center px-1">
          <Text className="text-meta text-muted-foreground underline">{translate('transactions.filter.clear_all')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function FilterResultCard({ count, total, sort, onSortPress }: { count: number; total: number; sort: TransactionSort; onSortPress: () => void }) {
  const currency = useAppStore.use.currency();
  return (
    <View className="mt-3.5 flex-row items-center justify-between gap-3 rounded-[18px] bg-card px-4 py-3">
      <View className="min-w-0 shrink">
        <Text className="text-meta text-muted-foreground">{count === 1 ? translate('transactions.count_one') : translate('transactions.count_many', { count })}</Text>
        <FormattedCurrency value={total} currency={currency} prefix={total > 0 ? '+' : ''} numberOfLines={1} adjustsFontSizeToFit className="text-xl font-bold tracking-tight" />
      </View>
      <Pressable
        onPress={onSortPress}
        style={getPressedStyle}
        accessibilityRole="button"
        className="h-9 flex-row items-center gap-1.5 rounded-full bg-card-2 px-3"
      >
        <ArrowDownUp size={16} colorClassName="accent-foreground" />
        <Text className="text-meta font-medium">{translate(`transactions.filter.sort_pill.${sort}`)}</Text>
      </Pressable>
    </View>
  );
}

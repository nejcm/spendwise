import type { MonthBudgetResult } from '../hooks';
import type { CurrencyKey } from '@/features/currencies';
import { format } from 'date-fns';
import * as React from 'react';
import { Pressable } from 'react-native';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { FormattedCurrency, Text, View } from '@/components/ui';
import { BudgetProgressBar, getColorClass } from '@/components/ui/budget-progress-bar';
import { ChevronDown, ChevronUp } from '@/components/ui/icon';
import { hexWithOpacity } from '@/lib/theme/colors';

type CardProps = {
  data: MonthBudgetResult;
  currency: CurrencyKey;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
};

export function BudgetMonthCard({ data, currency, isExpanded, onToggle, isLast }: CardProps) {
  const { year, month, totalBudget, totalSpent, categories } = data;
  const monthLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy');
  const ratio = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const [, textColorClass] = getColorClass(ratio);

  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <View>
      <Pressable onPress={onToggle} className="flex-row items-center gap-3 p-3 2xs:px-4">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className={`${textColorClass} text-sm font-medium`} numberOfLines={1}>
              {monthLabel}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View className="flex-row items-baseline gap-0.5">
                <FormattedCurrency
                  value={totalSpent}
                  currency={currency}
                  className="text-sm font-medium text-foreground"
                />
                <Text className="text-sm text-muted-foreground">/</Text>
                <FormattedCurrency
                  value={totalBudget}
                  currency={currency}
                  className="text-sm text-muted-foreground"
                />
              </View>
            </View>
          </View>
          <BudgetProgressBar spent={totalSpent} budget={totalBudget} showPercentage bg="bg-muted" />
        </View>
        <ChevronIcon size={16} className="text-muted-foreground" />
      </Pressable>

      {isExpanded && categories.length > 0 && (
        <View className="pr-7 pb-6">
          {categories.map((cat) => {
            const catRatio = cat.budget > 0 ? cat.spent / cat.budget : 0;
            const catIsOver = catRatio >= 1;
            return (
              <View key={cat.id}>
                <View className="flex-row items-center gap-3 px-4 py-1.5">
                  <View
                    className="relative size-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: hexWithOpacity(cat.color ?? DEFAULT_COLOR, 36) }}
                  >
                    <Text className="text-xl">
                      {cat.icon?.trim() || cat.name.charAt(0).toUpperCase()}
                    </Text>
                    {catIsOver && (
                      <View className="absolute -top-1 -right-1 size-3 rounded-full bg-danger-500" />
                    )}
                  </View>
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <View className="flex-row items-baseline gap-0.5">
                        <FormattedCurrency
                          value={cat.spent}
                          currency={currency}
                          className="text-sm font-medium text-foreground"
                        />
                        <Text className="text-sm text-muted-foreground">/</Text>
                        <FormattedCurrency
                          value={cat.budget}
                          currency={currency}
                          className="text-sm text-muted-foreground"
                        />
                      </View>
                    </View>
                    <BudgetProgressBar spent={cat.spent} budget={cat.budget} showPercentage bg="bg-muted" />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Row separator (between collapsed months) */}
      {!isLast && <View className="h-px bg-border" />}
    </View>
  );
}

type ListProps = {
  months: MonthBudgetResult[];
  currency: CurrencyKey;
};

export function BudgetMonthCardList({ months, currency }: ListProps) {
  const [expandedKey, setExpandedKey] = React.useState<string | null>(null);

  if (months.length === 0) return null;

  return (
    <View className="overflow-hidden rounded-xl bg-card py-1 2xs:py-2">
      {months.map((m, index) => {
        const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
        return (
          <BudgetMonthCard
            key={key}
            data={m}
            currency={currency}
            isExpanded={expandedKey === key}
            isLast={index === months.length - 1}
            onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
          />
        );
      })}
    </View>
  );
}

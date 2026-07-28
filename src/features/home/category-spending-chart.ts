import type { CategorySpend } from '@/features/insights/types';
import { translate } from '@/lib/i18n';
import { chartColors } from '@/lib/theme/colors';

const MAX_VISIBLE_CATEGORIES = 5;

export type CategoryChartItem = {
  color: string;
  key: string;
  label: string;
  value: number;
};

export function getCategorySpendingChartData(categories: CategorySpend[]): CategoryChartItem[] {
  const expenses = categories
    .filter((category) => category.expense_total > 0)
    .sort((a, b) => b.expense_total - a.expense_total);

  const visible = expenses.slice(0, MAX_VISIBLE_CATEGORIES);
  const items = visible.map((category, index) => ({
    color: category.category_color || chartColors[index % chartColors.length],
    key: category.category_id,
    label: category.category_name,
    value: category.expense_total,
  }));

  if (expenses.length <= MAX_VISIBLE_CATEGORIES) return items;

  const otherTotal = expenses
    .slice(MAX_VISIBLE_CATEGORIES - 1)
    .reduce((sum, category) => sum + category.expense_total, 0);

  return [
    ...items.slice(0, MAX_VISIBLE_CATEGORIES - 1),
    {
      color: chartColors[(MAX_VISIBLE_CATEGORIES - 1) % chartColors.length],
      key: 'other',
      label: translate('home.category_spending_other'),
      value: otherTotal,
    },
  ];
}

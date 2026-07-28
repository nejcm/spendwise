import * as React from 'react';
import { useAppStore } from '@/lib/store/store';
import { CategorySpendingChartCard } from './category-spending-chart-card';
import { MonthlyExpenseTrendCard } from './monthly-expense-trend-card';

export function HomeScreenChart() {
  const chart = useAppStore.use.homeScreenChart();

  if (chart === 'none') return null;
  if (chart === 'category_spending') return <CategorySpendingChartCard />;

  return <MonthlyExpenseTrendCard />;
}

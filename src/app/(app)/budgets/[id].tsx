import { useLocalSearchParams } from 'expo-router';

import { BudgetDetailScreen } from '@/features/budgets/budget-detail-screen';

export default function BudgetDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BudgetDetailScreen categoryId={id} />;
}

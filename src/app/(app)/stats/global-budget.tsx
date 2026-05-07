import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import ScreenHeader from '@/components/screen-header';
import { Text } from '@/components/ui';
import { GlobalBudgetForm } from '@/features/stats/components/global-budget-form';
import { useGlobalBudget } from '@/features/stats/hooks';
import { translate } from '@/lib/i18n';

export default function GlobalBudgetRoute() {
  const router = useRouter();
  const { data: currentBudget = null, isLoading } = useGlobalBudget();

  if (isLoading) {
    return (
      <>
        <ScreenHeader title={translate('stats.global_budget_label')} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text>{translate('common.loading')}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title={translate('stats.global_budget_label')} />
      <GlobalBudgetForm
        currentBudget={currentBudget}
        onSuccess={() => router.back()}
        onCancel={() => router.back()}
      />
    </>
  );
}

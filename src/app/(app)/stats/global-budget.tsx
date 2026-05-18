import { useRouter } from 'expo-router';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import ScreenHeader from '@/components/screen-header';
import { Text, View } from '@/components/ui';
import { GlobalBudgetForm } from '@/features/stats/components/global-budget-form';
import { useGlobalBudget } from '@/features/stats/hooks';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';

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

  const onBack = () => goBackOrFallback(router);
  return (
    <>
      <ScreenHeader title={translate('stats.global_budget_label')} />
      <GlobalBudgetForm
        currentBudget={currentBudget}
        onSuccess={onBack}
        onCancel={onBack}
        style={styles.form}
      />
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingTop: 16,
  },
});

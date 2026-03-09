import * as React from 'react';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';

export default function BudgetsScreen() {
  return (
    <View className="flex-1 items-center justify-center px-4">
      <FocusAwareStatusBar />
      <Text className="text-2xl font-bold">Budgets</Text>
      <Text className="mt-2 text-center text-neutral-500">Your budgets will appear here.</Text>
    </View>
  );
}

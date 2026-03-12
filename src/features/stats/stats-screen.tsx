import * as React from 'react';

import { FocusAwareStatusBar, ScrollView, Text, View } from '@/components/ui';
import { defaultStyles } from '@/lib/theme/styles';

export function StatsScreen() {
  return (
    <View className="flex-1 bg-white">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" style={defaultStyles.transparentBg}>
        <View className="gap-2 px-4 py-6">
          <Text className="text-2xl font-bold text-foreground">Stats</Text>
          <Text className="text-sm text-neutral-500">
            This screen is a placeholder for charts and insights.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

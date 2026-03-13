import * as React from 'react';
import { View } from 'react-native';

type Props = {
  spent: number;
  total: number;
  height?: number;
};

function getProgressColor(ratio: number): string {
  if (ratio > 1) {
    return '#EF4444';
  }
  if (ratio > 0.8) {
    return '#F59E0B';
  }
  return '#22C55E';
}

export function BudgetProgressBar({ spent, total, height = 8 }: Props) {
  const ratio = total > 0 ? spent / total : 0;
  const width = Math.min(ratio * 100, 100);
  const color = getProgressColor(ratio);

  return (
    <View
      className="w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      style={{ height }}
    >
      <View
        className="rounded-full"
        style={{ width: `${width}%`, height, backgroundColor: color }}
      />
    </View>
  );
}

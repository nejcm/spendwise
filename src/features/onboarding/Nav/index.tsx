/* eslint-disable react/no-array-index-key */
import { View } from '@/components/ui';

const TOTAL_STEPS = 3;

export type IntroNavProps = {
  current: number;
};

export default function IntroNav({ current }: IntroNavProps) {
  return (
    <View className="mb-8 flex-row justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
        current === index
          ? (
              <View key={index} className="h-3 w-5 rounded-full border-2 border-black bg-white dark:border-white dark:bg-neutral-950" />
            )
          : (
              <View key={index} className="size-3 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            )
      ))}
    </View>
  );
}

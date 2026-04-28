import * as React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useTagsForTransaction } from './hooks';

type Props = {
  transactionId: string;
};

export function TransactionTagChips({ transactionId }: Props) {
  const { data: tags } = useTagsForTransaction(transactionId);

  if (!tags || tags.length === 0) return null;

  return (
    <View className="mt-1 flex-row flex-wrap gap-1">
      {tags.map((tag) => (
        <View
          key={tag.id}
          className="flex-row items-center gap-1 rounded-full px-2 py-0.5"
          style={{ backgroundColor: `${tag.color}28` }}
        >
          <View className="size-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
          <Text className="text-xs" style={{ color: tag.color }} numberOfLines={1}>
            {tag.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

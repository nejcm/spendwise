import type { Tag } from './types';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { getPressedStyle, Text } from '@/components/ui';
import { useTags } from './hooks';

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

function TagChip({ tag, selected, onPress }: { tag: Tag; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={getPressedStyle}
      className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
        selected ? 'border-transparent bg-foreground' : 'border-border bg-card'
      }`}
    >
      <View
        className="size-2 rounded-full"
        style={{ backgroundColor: selected ? '#ffffff' : tag.color }}
      />
      <Text
        className={`text-xs font-medium ${selected ? 'text-background' : 'text-foreground'}`}
        numberOfLines={1}
      >
        {tag.name}
      </Text>
    </Pressable>
  );
}

export function TagSelector({ selectedIds, onChange }: Props) {
  const { data: tags = [] } = useTags();

  if (tags.length === 0) return null;

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <View className="flex-row flex-wrap gap-2">
      {tags.map((tag) => (
        <TagChip
          key={tag.id}
          tag={tag}
          selected={selectedIds.includes(tag.id)}
          onPress={() => toggle(tag.id)}
        />
      ))}
    </View>
  );
}

import type { Category } from './types';
import * as React from 'react';

import { Pressable, View } from 'react-native';

import { Modal, Text, useModal } from '@/components/ui';

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (category: Category) => void;
  label?: string;
};

export function CategoryPicker({ categories, selectedId, onSelect, label }: Props) {
  const modal = useModal();
  const selected = categories.find((c) => c.id === selectedId);

  return (
    <>
      <View className="mb-2">
        {label && <Text className="mb-1 text-lg text-gray-600 dark:text-gray-100">{label}</Text>}
        <Pressable
          className="flex-row items-center rounded-xl border-[0.5px] border-gray-300 bg-gray-100 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
          onPress={modal.present}
        >
          {selected
            ? (
                <View className="flex-row items-center gap-2">
                  <View className="size-6 rounded-full" style={{ backgroundColor: selected.color }} />
                  <Text className="text-base dark:text-gray-100">{selected.name}</Text>
                </View>
              )
            : (
                <Text className="text-base text-gray-400">Select category</Text>
              )}
        </Pressable>
      </View>

      <Modal ref={modal.ref} title="Select Category" snapPoints={['70%']}>
        <View className="flex-row flex-wrap gap-2 p-4">
          {categories.map((category) => (
            <Pressable
              key={category.id}
              className={`flex-row items-center gap-2 rounded-xl px-3 py-2 ${
                selectedId === category.id
                  ? 'border-2 border-primary-400'
                  : 'border border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => {
                onSelect(category);
                modal.dismiss();
              }}
            >
              <View className="size-5 rounded-full" style={{ backgroundColor: category.color }} />
              <Text className="text-sm dark:text-gray-100">{category.name}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </>
  );
}

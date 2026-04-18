import type { Category } from './types';
import type { OptionType, SelectProps } from '@/components/ui';

import * as React from 'react';
import { View } from 'react-native';
import { Select, Text } from '@/components/ui';
import { SkeletonBox } from '@/components/ui/skeleton';
import { useCategories } from '@/features/categories/api';
import { translate } from '@/lib/i18n';
import { hexWithOpacity } from '../../lib/theme/colors';

type CategoryOption = OptionType<string> & { color: string; icon: string | null; name: string };

export type CategoryPickerProps = Omit<SelectProps, 'value' | 'options' | 'onSelect'> & {
  selectedId: string | null;
  onSelect: (category: Category) => void;
  label?: string;
  error?: string;
};

const GRID_COLUMNS = 3;

export function CategoryPicker({ selectedId, onSelect, label, error, ...props }: CategoryPickerProps) {
  const { data: categories = [], isLoading } = useCategories();

  const options = React.useMemo<CategoryOption[]>(
    () =>
      categories.map((c) => ({
        label: c.icon ? `${c.icon} ${c.name}` : c.name,
        name: c.name,
        value: c.id,
        color: c.color,
        icon: c.icon,
      })),
    [categories],
  );

  const handleSelect = React.useCallback(
    (value: string | number) => {
      const category = categories.find((c) => c.id === value);
      if (category) onSelect(category);
    },
    [categories, onSelect],
  );

  const renderItem = React.useCallback(
    (item: OptionType) => {
      const opt = item as CategoryOption;
      const isSelected = selectedId === opt.value;
      return (
        <View className="flex-1 items-center justify-center gap-2 py-1 2xs:gap-3">
          <View
            className="size-14 items-center justify-center rounded-full 3xs:size-16 2xs:size-18"
            style={{ backgroundColor: hexWithOpacity(opt.color, 30) }}
          >
            {opt.icon
              ? <Text className="text-2xl 3xs:text-3xl 2xs:text-4xl">{opt.icon}</Text>
              : <Text className="text-2xl font-semibold text-white 3xs:text-3xl 2xs:text-4xl">{opt.label.slice(0, 2).toUpperCase()}</Text>}
          </View>
          <Text
            className={`text-center text-sm/tight 2xs:text-base/tight ${isSelected ? 'text-foreground underline' : 'text-muted-foreground'}`}
            numberOfLines={2}
          >
            {opt.name}
          </Text>
        </View>
      );
    },
    [selectedId],
  );

  if (isLoading) {
    return <SkeletonBox height={44} />;
  }
  return (
    <Select
      label={label}
      value={selectedId ?? undefined}
      options={options}
      onSelect={handleSelect}
      placeholder={translate('categories.select_category')}
      error={error}
      title={translate('categories.select_category')}
      stackBehavior="push"
      itemClassName="border-none"
      listProps={{ numColumns: GRID_COLUMNS }}
      renderItem={renderItem}
      {...props}
    />
  );
}

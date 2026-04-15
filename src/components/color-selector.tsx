/* eslint-disable react-refresh/only-export-components */
import type { OptionsProps, OptionType, SelectProps } from './ui';
import { cn } from 'tailwind-variants';
import { COLOR_OPTIONS } from '@/lib/theme/colors';
import { Select, View } from './ui';

export const DEFAULT_COLOR = '#0284c7';

// [item size, item container size]
const sizes: Record<NonNullable<SelectProps['size']>, [string, string]> = {
  'xs': ['size-8', 'min-h-10'],
  'sm': ['size-10', 'min-h-12'],
  'md': ['size-12', 'min-h-14'],
  'lg': ['size-14', 'min-h-16'],
  'xl': ['size-16', 'min-h-18'],
  '2xl': ['size-18', 'min-h-20'],
};

function renderItem(item: OptionType) {
  return (
    <View
      className="min-h-10 w-full max-w-10 flex-1 rounded-full border border-border 2xs:min-h-12 2xs:max-w-12"
      style={{ backgroundColor: String(item.value) }}
    />
  );
}

function renderSelectedItem(size: SelectProps['size'] = 'md', fallback: string | number | undefined) {
  return (item: OptionType | null) => (
    <View
      className={`rounded-full border border-border ${sizes[size][0]}`}
      style={{ backgroundColor: String(item?.value || fallback) }}
    />
  );
}

const listProps: OptionsProps<string>['listProps'] = { numColumns: 5 };

export default function ColorSelector(props: Omit<SelectProps, 'options'>) {
  const size = props.size ?? 'md';
  return (
    <Select
      options={COLOR_OPTIONS}
      showChevron={false}
      {...props}
      size={size}
      listProps={listProps}
      inputClassName={cn('border-0 bg-transparent px-0', props.inputClassName)}
      itemClassName="px-1 py-2 w-full min-h-14 2xs:min-h-16"
      renderItem={renderItem}
      renderSelectedItem={renderSelectedItem(size, props.value)}
    />
  );
}

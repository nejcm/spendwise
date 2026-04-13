/* eslint-disable react-refresh/only-export-components */
import type { OptionsProps, OptionType, SelectProps } from './ui';
import { cn } from 'tailwind-variants';
import { COLOR_OPTIONS } from '@/lib/theme/colors';
import { Select, View } from './ui';

export const DEFAULT_COLOR = '#0284c7';

const sizes: Record<NonNullable<SelectProps['size']>, string> = {
  'xs': 'size-8',
  'sm': 'size-10',
  'md': 'size-12',
  'lg': 'size-14',
  'xl': 'size-16',
  '2xl': 'size-18',
};

function renderItem(item: OptionType) {
  return (
    <View
      className="size-full min-h-12 max-w-12 flex-1 rounded-full border border-border"
      style={{ backgroundColor: String(item.value) }}
    />
  );
}

function renderSelectedItem(size: SelectProps['size'] = 'md', fallback: string | number | undefined) {
  return (item: OptionType | null) => (
    <View
      className={`rounded-full border border-border ${sizes[size]}`}
      style={{ backgroundColor: String(item?.value || fallback) }}
    />
  );
}

const listProps: OptionsProps<string>['listProps'] = { numColumns: 5 };

export default function ColorSelector(props: Omit<SelectProps, 'options'>) {
  return (
    <Select
      options={COLOR_OPTIONS}
      showChevron={false}
      {...props}
      listProps={listProps}
      inputClassName={cn('border-0 bg-transparent px-0', props.inputClassName)}
      itemClassName="min-h-10 px-1 py-2 min-w-10"
      renderItem={renderItem}
      renderSelectedItem={renderSelectedItem(props.size ?? 'md', props.value)}
    />
  );
}

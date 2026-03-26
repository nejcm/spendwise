import type { OptionsProps, OptionType, SelectProps } from './ui';
import { COLOR_OPTIONS } from '../lib/theme/colors';
import { Select, View } from './ui';

const DEFAULT_COLOR = 'bg-sky-600';

// eslint-disable-next-line react-refresh/only-export-components
export function getBgColor(color: string | undefined) {
  return color?.startsWith('#') ? `bg-[${color}]` : color;
}

function renderItem(item: OptionType) {
  return (
    <View className={`size-full min-h-12 max-w-12 flex-1 rounded-full border border-border ${getBgColor(String(item.value))}`} />
  );
}

function renderSelectedItem(item?: OptionType | null) {
  return (
    <View className={`size-full min-h-14 max-w-14 flex-1 rounded-full border border-border ${getBgColor(String(item?.value || DEFAULT_COLOR))}`} />
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
      inputClassName="min-w-22 px-0 bg-transparent border-0"
      itemClassName="min-h-18"
      renderItem={renderItem}
      renderSelectedItem={renderSelectedItem}
    />
  );
}

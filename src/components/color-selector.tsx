import type { OptionType, SelectProps } from './ui';
import { COLOR_OPTIONS } from '../lib/theme/colors';
import { Select, View } from './ui';

function renderItem(item: OptionType) {
  return (
    <View className="flex-1 flex-row items-center justify-center">
      <View className={`size-full min-h-12 max-w-12 flex-1 rounded-full ${item.value}`} />
    </View>
  );
}

function renderSelectedItem(item?: OptionType | null) {
  return (
    <View className="flex-1 flex-row items-center justify-center">
      <View className={`size-full min-h-14 max-w-14 flex-1 rounded-full ${item?.value || 'bg-sky-600'}`} />
    </View>
  );
}

export default function ColorSelector(props: Omit<SelectProps, 'options'>) {
  return (
    <Select
      options={COLOR_OPTIONS}
      showChevron={false}
      {...props}
      listProps={{ numColumns: 5 }}
      inputClassName="min-w-22 px-0 bg-transparent border-0"
      renderItem={renderItem}
      renderSelectedItem={renderSelectedItem}
    />
  );
}

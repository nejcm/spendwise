import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { ImageSource } from 'expo-image';
import type { FlatListProps, PressableProps } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import type { ModalProps } from './modal';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { Check, ChevronDown } from 'lucide-react-native';

import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn, tv } from 'tailwind-variants';
import { useUniwind } from 'uniwind';
import { IS_WEB } from '@/lib/base';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { Image } from './image';
import { Input } from './input';
import { Modal, useModal } from './modal';
import { Text } from './text';

const selectTv = tv({
  slots: {
    container: '',
    label: 'mb-1 text-sm/snug text-foreground',
    input:
      'flex-row items-center justify-center rounded-lg border px-4 py-3',
    inputValue: '',
    image: 'size-6 rounded-full',
  },
  variants: {
    color: {
      default: {
        input: 'border-border bg-input focus:border-gray-800 focus:dark:border-gray-300',
        inputValue: 'text-foreground',
      },
      secondary: {
        input: 'border-gray-300 bg-gray-200 focus:border-gray-800 dark:border-border dark:bg-input focus:dark:border-gray-300',
        inputValue: 'text-foreground',
      },
    },
    size: {
      xs: {
        input: 'h-6 px-2',
        label: 'text-xs/snug',
        inputValue: 'text-xs/snug',
        image: 'size-4',
      },
      sm: {
        input: 'h-9 px-3',
        label: 'text-xs/snug',
        inputValue: 'text-sm/snug',
        image: 'size-5',
      },
      md: {
        input: 'h-11 px-3',
        label: 'text-sm/snug',
        inputValue: 'text-base/snug',
        image: 'size-6',
      },
      lg: {
        input: 'h-13 px-4',
        label: 'text-base/snug',
        inputValue: 'text-lg/snug',
        image: 'size-7',
      },
      xl: {
        input: 'h-16 px-5',
        label: 'text-lg/snug',
        inputValue: 'text-xl/snug',
        image: 'size-8',
      },
    },
    error: {
      true: {
        input: 'border-danger-600 focus:border-danger-600 dark:border-danger-600',
        label: '',
        inputValue: '',
      },
    },
    disabled: {
      true: {
        input: 'bg-gray-100 dark:bg-gray-950',
      },
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'default',
    error: false,
    disabled: false,
  },
});

export type OptionType = { label: string; subtext?: string; value: string | number; image?: string | ImageSource; className?: string };

const Option = React.memo(
  ({
    label,
    selected = false,
    image,
    subtext,
    className,
    children,
    ...props
  }: PressableProps & Omit<OptionType, 'value'> & {
    selected?: boolean;
  }) => {
    return (
      <Pressable
        className={cn('flex-1 flex-row items-center border-b border-gray-200 p-3 dark:border-gray-700', className)}
        {...props}
      >
        {children
          || (
            <>
              {image && <Image source={image} className="mr-3 size-8 rounded-full" />}
              <View className="flex-1">
                <Text className="leading-tight dark:text-gray-100">{label}</Text>
                {subtext && <Text className="text-sm/snug text-gray-500 dark:text-gray-400">{subtext}</Text>}
              </View>
              {selected && <Check className="text-foreground" size={18} strokeWidth={2.5} />}
            </>
          )}
      </Pressable>
    );
  },
);

export type OptionsProps = {
  options: OptionType[];
  onSelect: (option: OptionType) => void;
  value?: string | number;
  testID?: string;
  className?: string;
  listProps?: Partial<Pick<FlatListProps<OptionType>, 'numColumns'>>;
  renderItem?: (item: OptionType) => React.ReactNode;
  searchEnabled?: boolean;
  searchPlaceholder?: string;
} & Omit<ModalProps, 'children'>;

function keyExtractor(item: OptionType) {
  return `select-item-${item.value}`;
}

const List = IS_WEB ? FlashList : BottomSheetFlatList;

export function Options({
  ref,
  options,
  onSelect,
  value,
  testID,
  listProps,
  className,
  renderItem,
  searchEnabled = false,
  searchPlaceholder = translate('common.search'),
  ...rest
}: OptionsProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const { theme } = useUniwind();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = React.useState('');
  const deferredSearchQuery = React.useDeferredValue(searchQuery);

  const filteredOptions = React.useMemo(() => {
    if (!searchEnabled) return options;

    const query = deferredSearchQuery.trim().toLowerCase();
    if (!query) return options;

    return options.filter((option) => {
      const labelMatch = option.label.toLowerCase().includes(query);
      const subtextMatch = option.subtext?.toLowerCase().includes(query);

      return labelMatch || subtextMatch;
    });
  }, [options, searchEnabled, deferredSearchQuery]);

  const renderSelectItem = React.useCallback(
    ({ item }: { item: OptionType }) => (
      <Option
        key={`select-item-${item.value}`}
        label={item.label}
        selected={value === item.value}
        image={item.image}
        subtext={item.subtext}
        children={renderItem?.(item)}
        onPress={() => onSelect(item)}
        className={cn(className, item.className)}
        testID={testID ? `${testID}-item-${item.value}` : undefined}
      />
    ),
    [onSelect, value, testID, className, renderItem],
  );

  const listHeader = React.useMemo(
    () =>
      searchEnabled
        ? (
            <View className="px-3 pt-3 pb-2">
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchPlaceholder}
                testID={testID ? `${testID}-search` : undefined}
              />
            </View>
          )
        : null,
    [searchEnabled, searchPlaceholder, searchQuery, testID],
  );

  return (
    <Modal
      ref={ref}
      index={0}
      enableDynamicSizing
      backgroundStyle={
        isDark ? defaultStyles.backgroundDark : defaultStyles.background
      }
      {...rest}
    >
      <List
        data={filteredOptions}
        keyExtractor={keyExtractor}
        renderItem={renderSelectItem}
        ListHeaderComponent={listHeader}
        testID={testID ? `${testID}-modal` : undefined}
        estimatedItemSize={52}
        {...listProps}
      />
    </Modal>
  );
}

export type SelectProps = {
  value?: string | number;
  label?: string;
  disabled?: boolean;
  error?: string;
  options?: OptionType[];
  onSelect?: (value: string | number) => void;
  placeholder?: string;
  testID?: string;
  containerClassName?: string;
  inputClassName?: string;
  showChevron?: boolean;
  listProps?: OptionsProps['listProps'];
  renderItem?: OptionsProps['renderItem'];
  renderSelectedItem?: (item: OptionType | null) => React.ReactNode;
  searchEnabled?: OptionsProps['searchEnabled'];
  searchPlaceholder?: OptionsProps['searchPlaceholder'];
} & Omit<VariantProps<typeof selectTv>, 'error'> & Omit<ModalProps, 'children'>;

export function Select({
  label,
  value,
  error,
  options = [],
  placeholder = translate('common.select'),
  disabled = false,
  onSelect,
  testID,
  size = 'md',
  containerClassName,
  inputClassName,
  showChevron = true,
  color,
  renderSelectedItem,
  searchEnabled,
  searchPlaceholder,
  ...rest
}: SelectProps) {
  const modal = useModal();
  const [selectedOption, setSelectedOption] = React.useState<OptionType | null>(() => options.find((t) => t.value === value) ?? null);

  const onSelectOption = React.useCallback(
    (option: OptionType) => {
      setSelectedOption(option);
      onSelect?.(option.value);
      modal.dismiss();
    },
    [modal, onSelect],
  );

  const styles = React.useMemo(
    () =>
      selectTv({
        error: Boolean(error),
        disabled,
        size,
        color,
      }),
    [error, disabled, size, color],
  );

  return (
    <>
      <View className={cn(styles.container(), containerClassName)}>
        {label && (
          <Text testID={testID ? `${testID}-label` : undefined} className={styles.label()}>
            {label}
          </Text>
        )}
        <Pressable
          className={cn(styles.input(), inputClassName)}
          disabled={disabled}
          onPress={modal.present}
          testID={testID ? `${testID}-trigger` : undefined}
        >
          {renderSelectedItem?.(selectedOption)
            || (
              <>
                <View className="flex-1 flex-row items-center gap-2">
                  {selectedOption?.image && <Image source={selectedOption.image} className={styles.image()} />}
                  <Text className={styles.inputValue({
                    className: !selectedOption?.label ? 'text-muted-foreground' : '',
                  })}
                  >
                    {selectedOption?.label ?? placeholder ?? ''}
                  </Text>
                </View>
                {showChevron && <ChevronDown className="size-5 text-muted-foreground" />}
              </>
            )}
        </Pressable>
        {error && (
          <View className="absolute top-full left-0 mt-1">
            <Text testID={`${testID}-error`} className="text-sm text-danger-500">
              {error}
            </Text>
          </View>
        )}
      </View>
      <Options
        testID={testID}
        ref={modal.ref}
        options={options}
        onSelect={onSelectOption}
        searchEnabled={searchEnabled}
        searchPlaceholder={searchPlaceholder}
        {...rest}
      />
    </>
  );
}

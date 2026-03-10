/* eslint-disable better-tailwindcss/no-unknown-classes */
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { PressableProps } from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { Check } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { cn, tv } from 'tailwind-variants';

import { useUniwind } from 'uniwind';
import colors from '@/components/ui/colors';

import { CaretDown } from '@/components/ui/icons';
import { Modal, useModal } from './modal';
import { Text } from './text';

const selectTv = tv({
  slots: {
    container: '',
    label: 'text-grey-100 mb-1 text-sm font-medium dark:text-neutral-100',
    input:
      'border-grey-50 mt-0 flex-row items-center justify-center rounded-md border px-4 py-3 dark:border-neutral-500 dark:bg-neutral-800',
    inputValue: 'dark:text-neutral-100',
  },

  variants: {
    size: {
      sm: {
        label: 'text-xs',
        input: 'px-3 py-2',
        inputValue: 'text-sm/5',
      },
      default: {
        label: 'text-sm',
        input: 'px-4 py-3',
        inputValue: 'text-base/5',
      },
      lg: {
        label: 'text-md',
        input: 'px-5 py-4',
        inputValue: 'text-lg/6',
      },
      xl: {
        label: 'text-lg',
        input: 'px-6 py-5',
        inputValue: 'text-xl/6',
      },
    },
    focused: {
      true: {
        input: 'border-neutral-600',
      },
    },
    error: {
      true: {
        input: 'border-danger-600',
        label: 'text-danger-600 dark:text-danger-600',
        inputValue: 'text-danger-600',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200',
      },
    },
  },
  defaultVariants: {
    size: 'default',
    error: false,
    disabled: false,
  },
});

const List = Platform.OS === 'web' ? FlashList : BottomSheetFlatList;

export type OptionType = { label: string; value: string | number };

type SelectSize = 'sm' | 'default' | 'lg' | 'xl';

type OptionsProps = {
  options: OptionType[];
  onSelect: (option: OptionType) => void;
  value?: string | number;
  testID?: string;
};

function keyExtractor(item: OptionType) {
  return `select-item-${item.value}`;
}

export function Options({
  ref,
  options,
  onSelect,
  value,
  testID,
}: OptionsProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const height = options.length * 70 + 100;
  const snapPoints = React.useMemo(() => [height], [height]);
  const { theme } = useUniwind();
  const isDark = theme === 'dark';
  const checkColor = isDark ? colors.white : colors.black;

  const renderSelectItem = React.useCallback(
    ({ item }: { item: OptionType }) => (
      <Option
        key={`select-item-${item.value}`}
        label={item.label}
        selected={value === item.value}
        checkColor={checkColor}
        onPress={() => onSelect(item)}
        testID={testID ? `${testID}-item-${item.value}` : undefined}
      />
    ),
    [checkColor, onSelect, value, testID],
  );

  return (
    <Modal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{
        backgroundColor: isDark ? colors.neutral[800] : colors.white,
      }}
    >
      <List
        data={options}
        keyExtractor={keyExtractor}
        renderItem={renderSelectItem}
        testID={testID ? `${testID}-modal` : undefined}
        estimatedItemSize={52}
      />
    </Modal>
  );
}

const Option = React.memo(
  ({
    label,
    selected = false,
    checkColor,
    ...props
  }: PressableProps & {
    selected?: boolean;
    label: string;
    checkColor: string;
  }) => {
    return (
      <Pressable
        className="flex-row items-center border-b border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
        {...props}
      >
        <Text className="flex-1 dark:text-neutral-100">{label}</Text>
        {selected && <Check color={checkColor} size={18} strokeWidth={2.5} />}
      </Pressable>
    );
  },
);

export type SelectProps = {
  value?: string | number;
  label?: string;
  disabled?: boolean;
  error?: string;
  options?: OptionType[];
  onSelect?: (value: string | number) => void;
  placeholder?: string;
  testID?: string;
  size?: SelectSize;
  containerClassName?: string;
};

export function Select(props: SelectProps) {
  const {
    label,
    value,
    error,
    options = [],
    placeholder = 'select...',
    disabled = false,
    onSelect,
    testID,
    size = 'default',
    containerClassName,
  } = props;
  const modal = useModal();
  const { theme } = useUniwind();
  const iconColor = theme === 'dark' ? colors.white : colors.black;

  const onSelectOption = React.useCallback(
    (option: OptionType) => {
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
      }),
    [error, disabled, size],
  );

  const textValue = React.useMemo(
    () => (value !== undefined ? (options?.filter((t) => t.value === value)?.[0]?.label ?? placeholder) : placeholder),
    [value, options, placeholder],
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
          className={styles.input()}
          disabled={disabled}
          onPress={modal.present}
          testID={testID ? `${testID}-trigger` : undefined}
        >
          <View className="flex-1">
            <Text className={styles.inputValue()}>{textValue}</Text>
          </View>
          <CaretDown color={iconColor} />
        </Pressable>
        {error && (
          <Text testID={`${testID}-error`} className="text-sm text-danger-300 dark:text-danger-600">
            {error}
          </Text>
        )}
      </View>
      <Options testID={testID} ref={modal.ref} options={options} onSelect={onSelectOption} />
    </>
  );
}

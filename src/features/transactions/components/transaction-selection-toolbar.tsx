import { View } from 'react-native';
import { IconButton, OverflowMenu, Text, TrashIcon } from '@/components/ui';
import { EllipsisVertical, X } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';

type TransactionSelectionToolbarProps = {
  selectedCount: number;
  onClear: () => void;
  onDelete: () => void;
};

export function TransactionSelectionToolbar({ selectedCount, onClear, onDelete }: TransactionSelectionToolbarProps) {
  return (
    <View className="absolute inset-x-14 bottom-3 flex-row items-center rounded-xl border border-border/50 bg-background/90 px-3 py-1 shadow-lg dark:bg-background/96">
      <Text className="flex-1 font-medium">
        {translate('transactions.selected_count', { count: selectedCount })}
      </Text>
      <IconButton accessibilityLabel={translate('common.close')} color="none" onPress={onClear} size="md">
        <X className="size-5 text-muted-foreground" />
      </IconButton>
      <OverflowMenu
        accessibilityLabel={translate('settings.more')}
        className="-mr-2"
        containerClassName="py-0"
        placement="above"
        icon={<EllipsisVertical className="text-muted-foreground" size={18} />}
        items={selectedCount > 0
          ? [{
              label: translate('common.delete'),
              onPress: onDelete,
              className: 'text-danger-600',
              icon: <TrashIcon size={16} colorClassName="accent-red-600" className="mr-2" />,
            }]
          : []}
      />
    </View>
  );
}

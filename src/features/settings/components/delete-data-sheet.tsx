import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { DeleteDataSelection } from '../queries';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Checkbox, GhostButton, ModalSheet, SolidButton, Text, View } from '@/components/ui';
import { translateCount } from '@/features/categories/helpers';
import { formatInstant } from '@/features/formatting/helpers';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useDataCounts, useDeleteData } from '../api';

const SNAP_POINTS = ['70%'];
const NONE: DeleteDataSelection = { categories: false, accounts: false };

export function DeleteDataSheet({ ref }: { ref: React.RefObject<BottomSheetModal | null> }) {
  const router = useRouter();
  const { data: counts } = useDataCounts();
  const deleteData = useDeleteData();
  const dateFormat = useAppStore.use.dateFormat();
  const lastBackupAt = useAppStore((s) => s.autoBackup.lastAutoBackupAt);
  const [selection, setSelection] = React.useState(NONE);

  const transactions = translateCount('categories.delete.transactions', counts?.transactions ?? 0);
  const rules = translateCount('categories.delete.rules', counts?.rules ?? 0);
  const extras = selection.categories || selection.accounts;
  const label = extras ? translate('settings.delete_data_selected') : translate('settings.delete_data_cta', { transactions, rules });

  const confirm = () => {
    Alert.alert(translate('settings.delete_data_confirm_title'), translate('settings.delete_data_irreversible'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.delete'),
        style: 'destructive',
        onPress: () => deleteData.mutate(selection, {
          onSuccess: () => ref.current?.close(),
          onError: (error) => {
            console.error('Failed to delete data', error);
            Alert.alert(translate('common.error'), translate('settings.delete_data_sheet_error'));
          },
        }),
      },
    ]);
  };

  const backUpFirst = () => {
    ref.current?.close();
    router.push('/settings/import-export');
  };

  const lastBackup = lastBackupAt && formatInstant(Math.floor(Date.parse(lastBackupAt) / 1000), dateFormat);
  const rows = [
    { key: 'transactions', label: translate('settings.transactions'), count: counts?.transactions, checked: true },
    { key: 'rules', label: translate('settings.recurring_rules'), count: counts?.rules, checked: true },
    { key: 'categories', label: translate('settings.categories_budgets'), count: counts?.categories, checked: selection.categories },
    { key: 'accounts', label: translate('settings.accounts'), count: counts?.accounts, checked: selection.accounts },
  ] as const;

  return (
    <ModalSheet ref={ref} title={translate('settings.delete_data')} snapPoints={SNAP_POINTS} onDismiss={() => setSelection(NONE)}>
      <BottomSheetScrollView style={defaultStyles.transparentBg} contentContainerClassName="px-5 pb-8">
        <Text className="text-meta text-muted-foreground">
          {translate('settings.delete_data_irreversible')}
          {lastBackup ? ` ${translate('settings.delete_data_last_backup', { date: lastBackup })}` : ''}
        </Text>
        <View className="mt-4 rounded-[18px] bg-card-2 px-4">
          {rows.map((row, index) => {
            const locked = row.key === 'transactions' || row.key === 'rules';
            return (
              <Checkbox.Root
                key={row.key}
                checked={row.checked}
                disabled={locked || deleteData.isPending}
                accessibilityLabel={row.label}
                onChange={(checked) => setSelection((s) => ({ ...s, [row.key]: checked }))}
                className={cn('h-14 gap-3', index > 0 && 'border-t border-border', locked && 'opacity-70')}
              >
                <Checkbox.Icon checked={row.checked} />
                <Text className="flex-1 text-row">{row.label}</Text>
                {row.count !== undefined && <Text className="text-meta text-muted-foreground">{row.count}</Text>}
              </Checkbox.Root>
            );
          })}
        </View>
        <Text className="mt-3 text-meta text-muted-foreground">{translate('settings.delete_data_sheet_locked_note')}</Text>
        <SolidButton color="danger" fullWidth className="mt-6" label={label} onPress={confirm} loading={deleteData.isPending} />
        <GhostButton className="mt-2" label={translate('settings.back_up_first')} onPress={backUpFirst} />
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

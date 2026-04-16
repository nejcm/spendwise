import type { TransactionType } from '../types';
import type { ModalSheetRef } from '@/components/ui/modal-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';
import { OutlineButton, SolidButton, Text } from '@/components/ui';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { useAccounts } from '@/features/accounts/hooks';
import { translate } from '@/lib/i18n';

const SNAP_POINTS = ['50%'];

export type TransactionFilterSheetProps = {
  ref?: ModalSheetRef<any>;
  selectedType: TransactionType | null;
  selectedAccountId: string | null;
  onSelectType: (type: TransactionType | null) => void;
  onSelectAccount: (id: string | null) => void;
  onClearAll: () => void;
  onClose: () => void;
};

export function TransactionFilterSheet({
  ref,
  selectedType,
  selectedAccountId,
  onSelectType,
  onSelectAccount,
  onClearAll,
  onClose,
}: TransactionFilterSheetProps) {
  const { data: accounts = [] } = useAccounts();
  const activeAccounts = accounts.filter((a) => !a.is_archived);

  return (
    <ModalSheet ref={ref} snapPoints={SNAP_POINTS} title={translate('common.filters')}>
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flex: 1 }}>
        <View className="gap-6">
          <View className="gap-3">
            <Text className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {translate('transactions.type')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              <SolidButton
                className="items-center rounded-2xl px-3"
                color={selectedType === 'expense' ? 'primary' : 'secondary'}
                size="xs"
                label={translate('transactions.expense')}
                onPress={() => onSelectType(selectedType === 'expense' ? null : 'expense')}
              />
              <SolidButton
                className="items-center rounded-2xl px-3"
                color={selectedType === 'income' ? 'primary' : 'secondary'}
                size="xs"
                label={translate('transactions.income')}
                onPress={() => onSelectType(selectedType === 'income' ? null : 'income')}
              />
              <SolidButton
                className="items-center rounded-2xl px-3"
                color={selectedType === 'transfer' ? 'primary' : 'secondary'}
                size="xs"
                label={translate('transactions.transfer')}
                onPress={() => onSelectType(selectedType === 'transfer' ? null : 'transfer')}
              />
            </View>
          </View>

          {activeAccounts.length > 0 && (
            <View className="gap-3">
              <Text className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {translate('transactions.account')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                <SolidButton
                  className="items-center rounded-2xl px-4"
                  color={!selectedAccountId ? 'primary' : 'secondary'}
                  size="xs"
                  label={translate('transactions.all')}
                  onPress={() => onSelectAccount(null)}
                />
                {activeAccounts.map((account) => (
                  <SolidButton
                    key={account.id}
                    className="items-center rounded-2xl px-3"
                    color={selectedAccountId === account.id ? 'primary' : 'secondary'}
                    size="xs"
                    label={account.icon ? `${account.icon} ${account.name}` : account.name}
                    onPress={() => onSelectAccount(selectedAccountId === account.id ? null : account.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
        <View className="mt-auto flex-row items-center gap-2 pt-6">
          <OutlineButton
            label={translate('common.clear')}
            color="secondary"
            onPress={onClearAll}
            className="flex-1"
          />
          <SolidButton
            label={translate('common.done')}
            color="primary"
            onPress={onClose}
            className="flex-1"
          />
        </View>
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

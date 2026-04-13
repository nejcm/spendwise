import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { Alert, Checkbox, ModalSheet, OutlineButton, SolidButton, Text, View } from '@/components/ui';
import { clearSelectedData } from '@/lib/dev';
import { translate } from '@/lib/i18n';

export function DeleteDataSheet({ ref }: { ref: React.RefObject<BottomSheetModal<any> | null> }) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const [deleteAccounts, setDeleteAccounts] = React.useState(false);
  const [deleteCategories, setDeleteCategories] = React.useState(false);

  const resetOptions = React.useCallback(() => {
    setDeleteAccounts(false);
    setDeleteCategories(false);
  }, []);

  const dismiss = React.useCallback(() => {
    resetOptions();
    ref.current?.dismiss();
  }, [ref, resetOptions]);

  const deleteDataMutation = useMutation({
    mutationFn: async () => {
      await clearSelectedData(db, queryClient, {
        deleteAccounts,
        deleteCategories,
      });
    },
    onSuccess: () => {
      dismiss();
    },
    onError: (error) => {
      console.error('Failed to clear selected data', error);
      Alert.alert(translate('common.error'), translate('settings.delete_data_sheet_error'));
    },
  });

  const onConfirm = React.useCallback(() => {
    if (deleteDataMutation.isPending) return;
    deleteDataMutation.mutate();
  }, [deleteDataMutation]);

  return (
    <ModalSheet
      ref={ref}
      title={translate('settings.delete_data_sheet_title')}
      snapPoints={['58%']}
      onDismiss={resetOptions}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4 pb-6">
          <Text tx="settings.delete_data_sheet_description" className="mb-5 text-muted-foreground" />
          <View className="gap-4">
            <Checkbox
              checked
              disabled
              onChange={() => {}}
              accessibilityLabel={translate('settings.transactions')}
              label={translate('settings.transactions')}
            />
            <Checkbox
              checked
              disabled
              onChange={() => {}}
              accessibilityLabel={translate('settings.scheduled')}
              label={translate('settings.scheduled')}
            />
            <Checkbox
              checked={deleteCategories}
              disabled={deleteDataMutation.isPending}
              onChange={setDeleteCategories}
              accessibilityLabel={translate('settings.categories')}
              label={translate('settings.categories')}
            />
            <Checkbox
              checked={deleteAccounts}
              disabled={deleteDataMutation.isPending}
              onChange={setDeleteAccounts}
              accessibilityLabel={translate('settings.accounts')}
              label={translate('settings.accounts')}
            />
          </View>

        </View>
      </BottomSheetScrollView>
      <View className="mt-auto flex-row gap-3 p-4">
        <OutlineButton
          fullWidth
          className="flex-1"
          label={translate('common.cancel')}
          onPress={dismiss}
          disabled={deleteDataMutation.isPending}
        />
        <SolidButton
          color="danger"
          fullWidth
          className="flex-1"
          label={translate('settings.delete_data_sheet_confirm')}
          onPress={onConfirm}
          loading={deleteDataMutation.isPending}
        />
      </View>
    </ModalSheet>
  );
}

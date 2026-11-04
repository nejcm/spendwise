import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { TransactionFormData } from '../transactions/types';
import type { ParsedRow } from './csv-parser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';

import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from '@/components/ui';
import { showSnackbar } from '@/components/ui/snackbar';
import { exportBackup, restoreBackup, validateBackup } from '@/features/imports-export/backup';
import { buildManualBackupFileName, IS_AUTO_BACKUP_SUPPORTED, writeAutoBackupFile } from '@/features/imports-export/backup-file';
import { documentPickerTypeForJson, pickValidatedFile } from '@/features/imports-export/pick-file';
import { IS_WEB } from '@/lib/base';
import { invalidateFor } from '@/lib/data/invalidation';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import { useAccounts } from '../accounts/hooks';
import { useCategories } from '../categories/hooks';
import { useCreateTransactions } from '../transactions/hooks/api';
import { getTransactionMatchFields } from '../transactions/queries';
import { flagDuplicates, importDateRange, mapCategoryNameToId, resolveImportRow } from './helpers';

export function useImportTransactions(onImported?: () => void) {
  const db = useSQLiteContext();
  const router = useRouter();
  const preferredCurrency = useAppStore.use.currency();
  const { isLoading: isCategoriesLoading, data: categories = [] } = useCategories();
  const { isLoading: isAccountsLoading, data: accounts = [] } = useAccounts();
  const onImportSuccess = (data: string[]) => {
    onImported?.();
    Alert.alert(
      translate('import-export.complete_title'),
      translate('import-export.complete_message', { count: data?.length }),
      [
        { onPress: () => goBackOrFallback(router), text: translate('common.ok') },
      ],
    );
  };
  const createTransactions = useCreateTransactions(onImportSuccess);

  const prepareMutation = useMutation({
    mutationFn: async ({ data }: { data: ParsedRow[] }) => {
      if (data.length === 0) throw new Error('No data to import');
      if (IS_AUTO_BACKUP_SUPPORTED) {
        await writeAutoBackupFile(db);
      }
      const transactions: TransactionFormData[] = [];
      for (const row of data) {
        const { account_id, type, amount, currency, date } = resolveImportRow(row, accounts, preferredCurrency);
        transactions.push({
          account_id,
          amount: amount / 100,
          currency,
          category_id: mapCategoryNameToId(row.categoryName, categories, row.note),
          date,
          note: row.note,
          merchant_name: null,
          location: null,
          type,
        });
      }
      return transactions;
    },
    onSuccess: (txs) => {
      createTransactions.mutate(txs);
    },
  });

  const markDuplicates = async (rows: ParsedRow[]) => {
    const resolved = rows.map((row) => resolveImportRow(row, accounts, preferredCurrency));
    const range = importDateRange(resolved);
    if (!range) return rows;
    return flagDuplicates(rows, resolved, await getTransactionMatchFields(db, ...range));
  };

  return {
    isLoading: prepareMutation.isPending || createTransactions.isPending,
    isInitializing: isCategoriesLoading || isAccountsLoading,
    onImport: prepareMutation.mutate,
    markDuplicates,
  };
}

export function useBackUpNow() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: () => writeAutoBackupFile(db),
    onSuccess: () => showSnackbar({ title: translate('import-export.backed_up') }),
    onError: (error) => {
      Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
    },
  });
}

export function useExportBackup() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: async () => {
      const backup = await exportBackup(db);
      const json = JSON.stringify(backup, null, 2);
      const fileName = buildManualBackupFileName();

      if (IS_WEB) {
        const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const file = new File(Paths.cache, fileName);
      if (file.exists) file.delete();
      file.create({ overwrite: true });
      file.write(json);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) throw new Error('File sharing is not available on this device.');
      await Sharing.shareAsync(file.uri, {
        dialogTitle: fileName,
        mimeType: 'application/json',
        UTI: 'public.json',
      });
    },
    onError: (error) => {
      Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
    },
  });
}

async function readAndRestore(db: SQLiteDatabase, uri: string) {
  const text = await (await fetch(uri)).text();
  let backup;
  try {
    backup = validateBackup(JSON.parse(text));
  }
  catch {
    throw new Error(translate('import-export.backup_invalid_error'));
  }

  const summary = translate('import-export.backup_restore_confirm_summary', {
    transactions: backup.transactions.length,
    accounts: backup.accounts.length,
    categories: backup.categories.length,
    recurringRules: backup.recurring_rules.length,
  });

  await new Promise<void>((resolve, reject) => {
    Alert.alert(
      translate('import-export.backup_restore_confirm_title'),
      `${translate('import-export.backup_restore_confirm_message')}\n\n${summary}`,
      [
        { text: translate('common.cancel'), onPress: () => reject(new Error('cancelled')), style: 'cancel' },
        { text: translate('common.yes'), onPress: () => resolve() },
      ],
    );
  });
  await restoreBackup(db, backup);
}

function onRestored(queryClient: QueryClient) {
  invalidateFor(queryClient, 'transaction', 'account', 'category', 'scheduledTransaction', 'currencyRates');
  Alert.alert(
    translate('import-export.backup_complete_title'),
    translate('import-export.backup_complete_message'),
  );
}

function onRestoreError(error: unknown) {
  if (error instanceof Error && error.message === 'cancelled') return;
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : String(error));
}

export function useImportBackup() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const asset = await pickValidatedFile({
        type: documentPickerTypeForJson(),
        ext: '.json',
        mimeNeedle: 'json',
        errorMessage: translate('import-export.backup_invalid_type_error'),
      });
      if (!asset) return false;
      await readAndRestore(db, asset.uri);
      return true;
    },
    onSuccess: (restored) => {
      if (restored) onRestored(queryClient);
    },
    onError: onRestoreError,
  });
}

export function useRestoreAutoBackup() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileUri: string) => readAndRestore(db, fileUri),
    onSuccess: () => onRestored(queryClient),
    onError: onRestoreError,
  });
}

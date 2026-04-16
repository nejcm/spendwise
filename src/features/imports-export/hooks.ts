import type { TransactionFormData } from '../transactions/types';
import type { ParsedRow } from './csv-parser';
import type { CurrencyKey } from '@/features/currencies';
import type { BackupData } from '@/features/imports-export/backup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { File, Paths } from 'expo-file-system';

import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from '@/components/ui';
import { CURRENCY_VALUES } from '@/features/currencies';
import { exportBackup, importBackup, validateBackup } from '@/features/imports-export/backup';
import { buildManualBackupFileName, IS_AUTO_BACKUP_SUPPORTED, writeAutoBackupFile } from '@/features/imports-export/backup-file';
import { documentPickerTypeForJson, pickValidatedFile } from '@/features/imports-export/pick-file';
import { IS_WEB } from '@/lib/base';
import { invalidateFor } from '@/lib/data/invalidation';
import { translate } from '@/lib/i18n';
import { setCurrency, useAppStore } from '@/lib/store/store';
import { useAccounts } from '../accounts/hooks';
import { useCategories } from '../categories/hooks';
import { useCreateTransactions } from '../transactions/hooks';
import { mapCategoryNameToId, matchAccountNameToId } from './helpers';

function inferBackupCurrency(backup: BackupData): CurrencyKey | undefined {
  if ('baseCurrency' in backup) {
    const candidate = backup.baseCurrency;
    if (CURRENCY_VALUES.includes(candidate as CurrencyKey)) return candidate as CurrencyKey;
  }
  const txBaseCurrency = backup.transactions.at(0)?.baseCurrency;
  if (!txBaseCurrency || !CURRENCY_VALUES.includes(txBaseCurrency as CurrencyKey)) return undefined;
  return txBaseCurrency as CurrencyKey;
}

export function useImportTransactions() {
  const db = useSQLiteContext();
  const router = useRouter();
  const preferredCurrency = useAppStore.use.currency();
  const { isLoading: isCategoriesLoading, data: categories = [] } = useCategories();
  const { isLoading: isAccountsLoading, data: accounts = [] } = useAccounts();
  const onImportSuccess = (data: string[]) => {
    Alert.alert(
      translate('import-export.complete_title'),
      translate('import-export.complete_message', { count: data?.length }),
      [
        { onPress: () => router.back(), text: translate('common.ok') },
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
        const type = row.type ?? (row.amount >= 0 ? 'income' : 'expense');
        transactions.push({
          account_id: matchAccountNameToId(row.accountName, accounts),
          amount: Math.abs(row.amount) / 100,
          currency: row.currency ?? preferredCurrency,
          category_id: mapCategoryNameToId(row.categoryName, categories, row.note),
          date: Math.floor(new Date(row.date).getTime() / 1000),
          note: row.note,
          type,
        });
      }
      return transactions;
    },
    onSuccess: (txs) => {
      createTransactions.mutate(txs);
    },
  });

  return {
    isLoading: prepareMutation.isPending || createTransactions.isPending,
    isInitializing: isCategoriesLoading || isAccountsLoading,
    onImport: prepareMutation.mutate,
  };
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
      if (!asset) return;

      const text = await (await fetch(asset.uri)).text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      }
      catch {
        throw new Error(translate('import-export.backup_invalid_error'));
      }

      let backup;
      try {
        backup = validateBackup(parsed);
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
      const previousCurrency = useAppStore.getState().currency;
      const backupCurrency = inferBackupCurrency(backup);
      if (backupCurrency && backupCurrency !== previousCurrency) {
        setCurrency(backupCurrency);
      }
      await importBackup(db, backup);
    },
    onSuccess: () => {
      invalidateFor(
        queryClient,
        'transaction',
        'account',
        'category',
        'scheduledTransaction',
      );

      Alert.alert(
        translate('import-export.backup_complete_title'),
        translate('import-export.backup_complete_message'),
      );
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'cancelled') return;
      Alert.alert(translate('common.error'), error instanceof Error ? error.message : String(error));
    },
  });
}

export function useRestoreAutoBackup() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileUri: string) => {
      const text = await (await fetch(fileUri)).text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      }
      catch {
        throw new Error(translate('import-export.backup_invalid_error'));
      }

      let backup;
      try {
        backup = validateBackup(parsed);
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

      const backupCurrency = inferBackupCurrency(backup);
      const previousCurrency = useAppStore.getState().currency;
      if (backupCurrency && backupCurrency !== previousCurrency) {
        setCurrency(backupCurrency);
      }
      await importBackup(db, backup);
    },
    onSuccess: () => {
      invalidateFor(
        queryClient,
        'transaction',
        'account',
        'category',
        'scheduledTransaction',
      );

      Alert.alert(
        translate('import-export.backup_complete_title'),
        translate('import-export.backup_complete_message'),
      );
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'cancelled') return;
      Alert.alert(translate('common.error'), error instanceof Error ? error.message : String(error));
    },
  });
}

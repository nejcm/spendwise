import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';

import Alert from '@/components/ui/alert';
import { exportBackup, importBackup, validateBackup } from '@/features/imports-export/backup';
import { IS_WEB } from '@/lib/base';
import { invalidateFor } from '@/lib/data/invalidation';
import { translate } from '@/lib/i18n';

const BACKUP_FILE_NAME_PREFIX = 'spendwise-backup-';

export function useExportBackup() {
  const db = useSQLiteContext();

  return useMutation({
    mutationFn: async () => {
      const backup = await exportBackup(db);
      const json = JSON.stringify(backup, null, 2);
      const fileName = `${BACKUP_FILE_NAME_PREFIX}${new Date().toISOString().slice(0, 10)}.json`;

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
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: 'application/json',
      });
      if (result.canceled || !result.assets[0]) return;

      const text = await (await fetch(result.assets[0].uri)).text();
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

      await new Promise<void>((resolve, reject) => {
        Alert.alert(
          translate('import-export.backup_restore_confirm_title'),
          translate('import-export.backup_restore_confirm_message'),
          [
            { text: translate('common.cancel'), onPress: () => reject(new Error('cancelled')), style: 'cancel' },
            { text: translate('common.yes'), onPress: () => resolve() },
          ],
        );
      });

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

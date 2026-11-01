import type { UniwindLucideIcon } from '@/components/ui/icon';
import type { ImportProps } from '@/features/imports-export/import';
import { useMutation } from '@tanstack/react-query';
import * as React from 'react';
import { useState } from 'react';
import { ActivityIndicator, Alert, Card, ListRow, SectionHeader, Text } from '@/components/ui';
import { ArrowUp, FileText, Upload } from '@/components/ui/icon';
import { IS_AUTO_BACKUP_SUPPORTED } from '@/features/imports-export/backup-file';
import { autoDetectColumnMapping, parseCSV } from '@/features/imports-export/csv-parser';
import { useExportBackup, useImportBackup } from '@/features/imports-export/hooks';
import Import from '@/features/imports-export/import';
import { documentPickerTypeForCsv, pickValidatedFile } from '@/features/imports-export/pick-file';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { AutoBackupSection, LastBackupCard } from './auto-backup-section';

const initialCsvState: ImportProps['state'] = {
  headers: [],
  allRows: [],
  mapping: {
    amount: null,
    date: null,
    currency: null,
    note: null,
    type: null,
    category: null,
    account: null,
    fallbackAmount: null,
    fallbackCurrency: null,
  },
};

export function ImportScreen() {
  const [importing, setImporting] = useState<boolean>(false);
  const [csvState, setCsvState] = useState<ImportProps['state']>(() => initialCsvState);
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const pickFileMutation = useMutation({
    mutationFn: async () => {
      const asset = await pickValidatedFile({
        type: documentPickerTypeForCsv(),
        ext: '.csv',
        mimeNeedle: 'csv',
        errorMessage: translate('import-export.csv_invalid_type_error'),
      });
      if (!asset) return null;

      const text = await (await fetch(asset.uri)).text();
      const rows = parseCSV(text);

      if (rows.length < 2) {
        throw new Error(translate('import-export.csv_min_rows_error'));
      }
      return {
        headers: rows[0],
        allRows: rows,
        mapping: autoDetectColumnMapping(rows),
      } satisfies ImportProps['state'];
    },
    onSuccess: (state) => {
      if (!state) return;
      setCsvState(state);
      setImporting(true);
    },
    onError: (error) => {
      Alert.alert(translate('common.error'), error.message);
    },
  });

  const moveRows: { key: string; icon: UniwindLucideIcon; title: string; meta: string; pending: boolean; onPress: () => void }[] = [
    { key: 'csv', icon: ArrowUp, title: translate('import-export.import_csv_title'), meta: translate('import-export.import_csv_meta'), pending: pickFileMutation.isPending, onPress: () => pickFileMutation.mutate() },
    { key: 'save', icon: FileText, title: translate('import-export.save_backup_title'), meta: translate('import-export.save_backup_meta'), pending: exportBackup.isPending, onPress: () => exportBackup.mutate() },
    { key: 'restore', icon: Upload, title: translate('import-export.restore_file_title'), meta: translate('import-export.restore_file_meta'), pending: importBackup.isPending, onPress: () => importBackup.mutate() },
  ];

  return (
    <SettingsPage title={translate('import-export.title')}>
      {importing
        ? (
            <Import
              state={csvState}
              setMapping={(mapping) => setCsvState((prev) => ({ ...prev, mapping }))}
              onClose={() => setImporting(false)}
            />
          )
        : (
            <>
              {IS_AUTO_BACKUP_SUPPORTED
                ? (
                    <>
                      <LastBackupCard />
                      <AutoBackupSection />
                    </>
                  )
                : (
                    <Card className="mt-5 gap-1 p-[18px]">
                      <Text className="text-row font-medium">{translate('import-export.auto_backup_web_unavailable_title')}</Text>
                      <Text className="text-meta text-muted-foreground">{translate('import-export.auto_backup_web_unavailable_description')}</Text>
                    </Card>
                  )}

              <SectionHeader title={translate('import-export.move_section_title')} />
              <Card className="px-4">
                {moveRows.map((row, index) => (
                  <ListRow
                    key={row.key}
                    className={cn('py-3.5', index > 0 && 'border-t border-border')}
                    icon={<row.icon size={22} colorClassName="accent-foreground" />}
                    title={row.title}
                    meta={<Text className="text-meta text-muted-foreground">{row.meta}</Text>}
                    trailing={row.pending ? <ActivityIndicator /> : undefined}
                    chevron
                    disabled={row.pending}
                    onPress={row.onPress}
                  />
                ))}
              </Card>
            </>
          )}
    </SettingsPage>
  );
}

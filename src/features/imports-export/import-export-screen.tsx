import type { AutoBackupInterval } from '@/features/imports-export/backup-file';
import type { ImportProps } from '@/features/imports-export/import';
import { useMutation } from '@tanstack/react-query';

import * as React from 'react';
import { useState } from 'react';
import DetailsSection from '@/components/details';

import { Alert, FocusAwareStatusBar, ScrollView, Select, SolidButton, Switch, Text, View } from '@/components/ui';
import { ArrowUp, Download, Upload } from '@/components/ui/icon';
import { formatDate } from '@/features/formatting/helpers';
import { IS_AUTO_BACKUP_SUPPORTED } from '@/features/imports-export/backup-file';
import { autoDetectColumnMapping, parseCSV } from '@/features/imports-export/csv-parser';
import { useExportBackup, useImportBackup } from '@/features/imports-export/hooks';
import Import from '@/features/imports-export/import';
import { documentPickerTypeForCsv, pickValidatedFile } from '@/features/imports-export/pick-file';
import { translate } from '@/lib/i18n';
import { updateAutoBackup, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';

const initialCsvState: ImportProps['state'] = {
  headers: [],
  allRows: [],
  mapping: { amount: null, date: null, currency: null, note: null, type: null, category: null },
};

function autoBackupIntervalOptions(): { label: string; value: AutoBackupInterval }[] {
  return [
    { label: translate('import-export.auto_backup_interval_daily'), value: 'daily' },
    { label: translate('import-export.auto_backup_interval_weekly'), value: 'weekly' },
    { label: translate('import-export.auto_backup_interval_monthly'), value: 'monthly' },
  ];
}

function AutoBackupSection() {
  const autoBackup = useAppStore.use.autoBackup();
  const dateFormat = useAppStore.use.dateFormat();

  if (!IS_AUTO_BACKUP_SUPPORTED) {
    return (
      <>
        <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.auto_backup_section_title" />
        <DetailsSection
          className="mb-4"
          data={[{
            label: translate('import-export.auto_backup_web_unavailable_title'),
            description: translate('import-export.auto_backup_web_unavailable_description'),
            value: <Text className="text-muted-foreground">—</Text>,
          }]}
        />
      </>
    );
  }

  const lastDisplay = autoBackup.lastAutoBackupAt
    ? formatDate(Math.floor(new Date(autoBackup.lastAutoBackupAt).getTime() / 1000), dateFormat)
    : translate('import-export.auto_backup_never');

  return (
    <>
      <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.auto_backup_section_title" />
      <DetailsSection
        className="mb-4"
        data={[
          {
            label: translate('import-export.auto_backup_enable_label'),
            description: translate('import-export.auto_backup_enable_description'),
            value: (
              <Switch
                accessibilityLabel={translate('import-export.auto_backup_enable_label')}
                checked={autoBackup.enabled}
                onChange={(checked) => updateAutoBackup({ enabled: checked })}
              />
            ),
          },
          ...(autoBackup.enabled
            ? [{
                label: translate('import-export.auto_backup_interval_label'),
                value: (
                  <Select<AutoBackupInterval>
                    containerClassName="min-w-36"
                    size="sm"
                    options={autoBackupIntervalOptions()}
                    value={autoBackup.interval}
                    onSelect={(interval) => updateAutoBackup({ interval })}
                  />
                ),
              }]
            : []),
          {
            label: translate('import-export.auto_backup_last_label'),
            value: lastDisplay,
          },
        ]}
      />
    </>
  );
}

function BackupSection() {
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  return (
    <>
      <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.backup_section_title" />
      <DetailsSection
        className="mb-4"
        data={[
          {
            label: translate('import-export.backup_download_label'),
            description: translate('import-export.backup_download_description'),
            value: (
              <SolidButton
                size="sm"
                className="min-w-16"
                iconLeft={<Download className="mr-1 text-background" size={16} />}
                label={translate('common.download')}
                loading={exportBackup.isPending}
                onPress={() => void exportBackup.mutate()}
              />
            ),
          },
          {
            label: translate('import-export.backup_restore_label'),
            description: translate('import-export.backup_restore_description'),
            value: (
              <SolidButton
                size="sm"
                className="min-w-16"
                iconLeft={<Upload className="mr-1 text-background" size={16} />}
                label={translate('common.restore')}
                loading={importBackup.isPending}
                onPress={() => importBackup.mutate()}
              />
            ),
          },
        ]}
      />
    </>
  );
}

export function ImportScreen() {
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [csvState, setCsvState] = useState<ImportProps['state']>(() => initialCsvState);

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
      setInProgress(true);
    },
    onError: (error) => {
      Alert.alert(translate('common.error'), error.message);
    },
  });

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" style={defaultStyles.transparentBg}>
        <View className="flex-1 px-4 py-8">
          {inProgress
            ? (
                <Import
                  state={csvState}
                  setMapping={(mapping) =>
                    setCsvState((prev) => ({
                      ...prev,
                      mapping,
                    }))}
                  onClose={() => setInProgress(false)}
                />
              )
            : (
                <>
                  <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.external_section_title" />
                  <DetailsSection
                    className="mb-6"
                    data={[{
                      label: translate('import-export.import_title'),
                      description: translate('import-export.pick_description'),
                      value: (
                        <SolidButton
                          size="sm"
                          className="min-w-16"
                          iconLeft={<ArrowUp className="mr-1 text-background" size={16} />}
                          label={translate('common.import')}
                          loading={pickFileMutation.isPending}
                          onPress={() => pickFileMutation.mutate()}
                        />
                      ),
                    }]}
                  />
                  <AutoBackupSection />
                  <BackupSection />
                </>
              )}
        </View>
      </ScrollView>
    </>
  );
}

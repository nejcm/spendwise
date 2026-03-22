import type { ImportProps } from '@/features/imports-export/import';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';

import * as React from 'react';
import { useState } from 'react';
import DetailsSection from '@/components/details';
import { FocusAwareStatusBar, ScrollView, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { ArrowDown, ArrowUp } from '@/components/ui/icon';
import { autoDetectColumnMapping, parseCSV } from '@/features/imports-export/csv-parser';
import { useExportBackup, useImportBackup } from '@/features/imports-export/hooks';
import Import from '@/features/imports-export/import';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';

type Screen = 'import' | 'export';

const initialCsvState: ImportProps['state'] = {
  headers: [],
  allRows: [],
  mapping: { amount: null, date: null, currency: null, note: null, type: null },
};

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
                iconLeft={<ArrowUp className="mr-1 text-background" size={16} />}
                label={translate('common.export')}
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
                iconLeft={<ArrowDown className="mr-1 text-background" size={16} />}
                label={translate('common.import')}
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
  const [screen, setScreen] = useState<Screen | undefined>();
  const [csvState, setCsvState] = useState<ImportProps['state']>(() => initialCsvState);

  const pickFileMutation = useMutation({
    mutationFn: async () => {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: 'text/csv',
      });
      if (result.canceled || !result.assets[0]) return null;
      const text = await (await fetch(result.assets[0].uri)).text();
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
      setScreen('import');
    },
    onError: (error) => {
      Alert.alert(translate('common.error'), error.message);
    },
  });

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        {!screen && (
          <>
            <BackupSection />
            <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.external_section_title" />
            <DetailsSection
              className="mb-4"
              data={[{
                label: translate('import-export.import_title'),
                description: translate('import-export.pick_description'),
                value: (
                  <SolidButton
                    size="sm"
                    className="min-w-16"
                    iconLeft={<ArrowDown className="mr-1 text-background" size={16} />}
                    label={translate('common.import')}
                    loading={pickFileMutation.isPending}
                    onPress={() => pickFileMutation.mutate()}
                  />
                ),
              }]}
            />
          </>
        )}
        {screen === 'import' && (
          <Import
            state={csvState}
            setMapping={(mapping) =>
              setCsvState((prev) => ({
                ...prev,
                mapping,
              }))}
            onClose={() => setScreen(undefined)}
          />
        )}
      </ScrollView>
    </>
  );
}

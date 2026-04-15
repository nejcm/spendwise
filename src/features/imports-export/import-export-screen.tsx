import type { ImportProps } from '@/features/imports-export/import';
import { useMutation } from '@tanstack/react-query';

import * as React from 'react';
import { useState } from 'react';
import DetailsSection from '@/components/details';

import { Alert, FocusAwareStatusBar, ScrollView, SolidButton, Text, View } from '@/components/ui';
import { ArrowUp } from '@/components/ui/icon';
import { autoDetectColumnMapping, parseCSV } from '@/features/imports-export/csv-parser';
import Import from '@/features/imports-export/import';
import { documentPickerTypeForCsv, pickValidatedFile } from '@/features/imports-export/pick-file';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import AutoBackupSection from './auto-backup-section';
import BackupSection from './backup-section';

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

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" style={defaultStyles.transparentBg}>
        <View className="flex-1 px-4 py-8">
          {importing
            ? (
                <Import
                  state={csvState}
                  setMapping={(mapping) =>
                    setCsvState((prev) => ({
                      ...prev,
                      mapping,
                    }))}
                  onClose={() => setImporting(false)}
                />
              )
            : (
                <>
                  <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.external_section_title" />
                  <DetailsSection
                    className="mb-8"
                    data={[{
                      label: translate('import-export.import_title'),
                      description: translate('import-export.pick_description'),
                      value: (
                        <SolidButton
                          size="sm"
                          className="min-w-28"
                          iconLeft={<ArrowUp className="mr-1 text-background" size={16} />}
                          label={translate('common.import')}
                          loading={pickFileMutation.isPending}
                          onPress={() => pickFileMutation.mutate()}
                        />
                      ),
                    }]}
                  />
                  <BackupSection />
                  <AutoBackupSection />
                </>
              )}
        </View>
      </ScrollView>
    </>
  );
}

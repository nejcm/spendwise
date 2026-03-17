import type { ImportProps } from '@/features/imports-export/import';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';

import * as Sharing from 'expo-sharing';
import * as React from 'react';
import { useState } from 'react';
import { View } from 'react-native';
import DetailsSection from '@/components/details';
import { FocusAwareStatusBar, ScrollView, SolidButton } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { useExportTransactions } from '@/features/imports-export/api';
import { formatTransactionsCsv } from '@/features/imports-export/csv-export';
import { autoDetectColumnMapping, parseCSV } from '@/features/imports-export/csv-parser';
import Import from '@/features/imports-export/import';
import { IS_WEB } from '@/lib/base';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';

type Screen = 'import' | 'export';

const initialCsvState: ImportProps['state'] = {
  headers: [],
  allRows: [],
  mapping: { amount: null, date: null, currency: null, note: null, type: null },
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function ImportScreen() {
  const [screen, setScreen] = useState<Screen | undefined>();
  const [csvState, setCsvState] = useState<ImportProps['state']>(() => initialCsvState);
  const exportTransactions = useExportTransactions();

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

  const exportFile = React.useCallback(async () => {
    try {
      const transactions = await exportTransactions.mutateAsync();
      if (transactions.length === 0) {
        throw new Error(translate('import-export.export_empty_error'));
      }

      const csv = formatTransactionsCsv(transactions);
      const fileName = `spendwise-transactions-${new Date().toISOString().slice(0, 10)}.csv`;

      if (IS_WEB) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
      file.write(csv);

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error(translate('import-export.export_unavailable_error'));
      }

      await Sharing.shareAsync(file.uri, {
        dialogTitle: translate('import-export.export_file'),
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
      });
    }
    catch (error) {
      Alert.alert(translate('common.error'), getErrorMessage(error));
    }
  }, [exportTransactions]);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        {!screen && (
          <>
            <DetailsSection
              className="mb-4"
              data={[{
                label: translate('import-export.import_title'),
                description: translate('import-export.pick_description'),
                value: (
                  <SolidButton
                    size="sm"
                    className="min-w-16"
                    label={translate('common.import')}
                    loading={pickFileMutation.isPending}
                    onPress={() => pickFileMutation.mutate()}
                  />
                ),
              }]}
            />
            <DetailsSection data={[{
              label: translate('import-export.export_title'),
              description: translate('import-export.export_description'),
              value: (
                <SolidButton
                  className="min-w-16"
                  size="sm"
                  label={translate('common.export')}
                  loading={exportTransactions.isPending}
                  onPress={() => void exportFile()}
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
    </View>
  );
}

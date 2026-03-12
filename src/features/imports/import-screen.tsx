import type { ColumnMapping, ParsedRow } from './csv-parser';

import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { formatCurrency } from '@/features/formatting/helpers';
import { useAccounts, useCreateTransaction } from '@/features/transactions/api';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { mapRows, parseCSV } from './csv-parser';

type Step = 'map' | 'pick' | 'preview';

const COLUMN_FIELDS: (keyof ColumnMapping)[] = ['date', 'amount', 'note', 'type'];

function autoDetect(headers: string[]): ColumnMapping {
  const m: ColumnMapping = { amount: null, date: null, note: null, type: null };
  headers.forEach((h, i) => {
    const lower = h.toLowerCase();
    if (lower.includes('date')) {
      m.date = i;
    }
    else if (lower.includes('amount') || lower.includes('value')) {
      m.amount = i;
    }
    else if (lower.includes('note') || lower.includes('memo')) {
      m.note = i;
    }
    else if (lower.includes('type') || lower.includes('category')) {
      m.type = i;
    }
  });
  return m;
}

type MapStepProps = {
  headers: string[];
  mapping: ColumnMapping;
  onMapping: (m: ColumnMapping) => void;
  onNext: () => void;
};

function MapStep({ headers, mapping, onMapping, onNext }: MapStepProps) {
  return (
    <View>
      <Text className="mb-4 text-lg font-medium">{translate('import.map_columns')}</Text>
      {COLUMN_FIELDS.map((field) => (
        <View key={field} className="mb-4">
          <Text className="mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {translate(`import.field_${field}` as any)}
            {field === 'date' || field === 'amount'
              ? (
                  <Text> *</Text>
                )
              : null}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              className={`rounded-full px-3 py-1 ${mapping[field] === null ? 'bg-neutral-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
              onPress={() => onMapping({ ...mapping, [field]: null })}
            >
              <Text className={`text-xs ${mapping[field] === null ? 'text-white' : ''}`}>
                None
              </Text>
            </Pressable>
            {headers.map((h, i) => (
              <Pressable
                key={h}
                className={`rounded-full px-3 py-1 ${mapping[field] === i ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
                onPress={() => onMapping({ ...mapping, [field]: i })}
              >
                <Text
                  className={`text-xs ${mapping[field] === i ? 'font-medium text-white' : ''}`}
                >
                  {h}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Button className="mt-2" label={translate('import.preview')} onPress={onNext} />
    </View>
  );
}

type PreviewStepProps = {
  accounts: { id: string; name: string }[];
  accountId: string;
  currency: string;
  importing: boolean;
  onAccountSelect: (id: string) => void;
  onImport: () => void;
  preview: ParsedRow[];
};

function PreviewStep({
  preview,
  accounts,
  accountId,
  onAccountSelect,
  onImport,
  importing,
  currency,
}: PreviewStepProps) {
  return (
    <View>
      <Text className="mb-2 text-lg font-medium">
        {`${translate('import.preview_title')} (${preview.length} ${translate('import.rows')})`}
      </Text>
      <Text className="mb-3 text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {translate('transactions.account')}
      </Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {accounts.map((a) => (
          <Pressable
            key={a.id}
            className={`rounded-full px-3 py-1.5 ${accountId === a.id ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
            onPress={() => onAccountSelect(a.id)}
          >
            <Text className={`text-sm ${accountId === a.id ? 'font-medium text-white' : ''}`}>
              {a.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {preview.slice(0, 10).map((row) => (
        <View
          key={`${row.date}-${row.amount}`}
          className="mb-1 flex-row items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800"
        >
          <View className="flex-1">
            <Text className="text-sm font-medium">{row.note || '—'}</Text>
            <Text className="text-xs text-neutral-500">{row.date}</Text>
          </View>
          <Text
            className={`text-sm font-medium ${row.amount >= 0 ? 'text-success-600' : 'text-danger-500'}`}
          >
            {`${row.amount >= 0 ? '+' : ''}${formatCurrency(Math.abs(row.amount), currency)}`}
          </Text>
        </View>
      ))}
      {preview.length > 10 && (
        <Text className="mt-2 text-center text-sm text-neutral-500">
          {`+${preview.length - 10} more rows`}
        </Text>
      )}
      <Button
        className="mt-4 mb-8"
        disabled={!accountId || importing}
        label={
          importing
            ? translate('common.loading')
            : `${translate('import.import')} ${preview.length} ${translate('import.rows')}`
        }
        onPress={onImport}
      />
    </View>
  );
}

export function ImportScreen() {
  const router = useRouter();
  const currency = useAppStore.use.currency();
  const { data: accounts = [] } = useAccounts();
  const createTransaction = useCreateTransaction();

  const [step, setStep] = useState<Step>('pick');
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    amount: null,
    date: null,
    note: null,
    type: null,
  });
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id ?? '');
  const [importing, setImporting] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: 'text/csv',
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const text = await (await fetch(result.assets[0].uri)).text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      Alert.alert('Error', 'CSV file must have at least a header row and one data row');
      return;
    }
    setHeaders(rows[0]);
    setAllRows(rows);
    setMapping(autoDetect(rows[0]));
    setStep('map');
  };

  const buildPreview = () => {
    if (mapping.date === null || mapping.amount === null) {
      Alert.alert('Error', 'Date and Amount columns are required');
      return;
    }
    setPreview(mapRows(allRows, mapping, true));
    setStep('preview');
  };

  const runImport = async () => {
    if (!accountId) {
      return;
    }
    setImporting(true);
    let count = 0;
    for (const row of preview) {
      const type = row.amount >= 0 ? ('income' as const) : ('expense' as const);
      await createTransaction.mutateAsync({
        account_id: accountId,
        amount: String(Math.abs(row.amount) / 100),
        category_id: null,
        date: row.date,
        note: row.note,
        type,
      });
      count++;
    }
    setImporting(false);
    Alert.alert('Import Complete', `${count} transactions imported`, [
      { onPress: () => router.back(), text: 'OK' },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" style={defaultStyles.transparentBg}>
        {step === 'pick' && (
          <View className="items-center py-16">
            <Text className="mb-2 text-lg font-medium">{translate('import.title')}</Text>
            <Text className="mb-8 text-center text-neutral-500">
              {translate('import.pick_description')}
            </Text>
            <Button label={translate('import.pick_file')} onPress={pickFile} />
          </View>
        )}
        {step === 'map' && (
          <MapStep
            headers={headers}
            mapping={mapping}
            onMapping={setMapping}
            onNext={buildPreview}
          />
        )}
        {step === 'preview' && (
          <PreviewStep
            accountId={accountId}
            accounts={accounts}
            currency={currency}
            importing={importing}
            preview={preview}
            onAccountSelect={setAccountId}
            onImport={runImport}
          />
        )}
      </ScrollView>
    </View>
  );
}

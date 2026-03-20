import type { Account } from '../accounts/types';
import type { CurrencyKey } from '../currencies';

import type { ColumnMapping, ParsedRow } from './csv-parser';
import { useRouter } from 'expo-router';

import * as React from 'react';

import { ScrollView, View } from 'react-native';
import { FormattedCurrency, Select, SolidButton, Text } from '@/components/ui';
import Alert from '@/components/ui/alert';
import { translate } from '@/lib/i18n';
import { OutlineButton } from '../../components/ui/outline-button';
import { useAppStore } from '../../lib/store';
import { useAccounts } from '../accounts/api';
import { useCreateTransaction } from '../transactions/api';
import { mapRows } from './csv-parser';

type Step = 'map' | 'preview';

const COLUMN_FIELDS: (keyof ColumnMapping)[] = ['date', 'amount', 'note', 'type'];

type MapStepProps = {
  headers: string[];
  mapping: ColumnMapping;
  onMapping: (m: ColumnMapping) => void;
  onNext: () => void;
};

function MapStep({ headers, mapping, onMapping, onNext }: MapStepProps) {
  const options = React.useMemo(() => {
    return [
      {
        label: translate('import-export.skip_column'),
        value: 'none',
      },
      ...headers.map((h, i) => ({
        label: h,
        value: i.toString(),
      })),
    ];
  }, [headers]);

  return (
    <View>
      <Text className="mb-4 text-xl font-medium">{translate('import-export.map_columns')}</Text>
      {COLUMN_FIELDS.map((field) => (
        <View key={field} className="mb-4 flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
              {translate(`import-export.field_${field}` as any)}
              {field === 'date' || field === 'amount'
                ? (
                    <Text>*</Text>
                  )
                : null}
            </Text>
          </View>
          <View className="flex-1">
            <Select
              size="sm"
              value={mapping[field] === null ? 'none' : String(mapping[field]) ?? 'none'}
              options={options}
              onSelect={(value) => {
                if (value === 'none') onMapping({ ...mapping, [field]: null });
                else onMapping({ ...mapping, [field]: Number.parseInt(value) });
              }}
            />
          </View>
        </View>
      ))}
      <SolidButton fullWidth className="mt-8" label={translate('import-export.preview')} onPress={onNext} />
    </View>
  );
}

export type PreviewStepProps = {
  accounts: Account[];
  accountId: string;
  currency: CurrencyKey;
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
      <Text className="mb-4 text-xl font-medium">
        {`${translate('import-export.preview_title')} (${preview.length} ${translate('import-export.rows')})`}
      </Text>
      <Text className="font-medium text-muted-foreground">
        {translate('transactions.account')}
      </Text>
      <ScrollView horizontal className="mb-4 py-2">
        <View className="flex-row gap-2">
          {accounts.map((a) => (
            <SolidButton
              key={a.id}
              size="sm"
              className="items-center rounded-3xl"
              color={accountId === a.id ? 'primary' : 'secondary'}
              label={`${a.icon} ${a.name}`}
              onPress={() => {
                onAccountSelect(a.id);
              }}
            />
          ))}
        </View>
      </ScrollView>
      {preview.slice(0, 10).map((row) => (
        <View
          key={`${row.date}-${row.amount}`}
          className="mb-1 flex-row items-center justify-between rounded-lg bg-card p-2"
        >
          <View className="flex-1">
            <Text className="text-sm font-medium">{row.note || '—'}</Text>
            <Text className="text-xs text-gray-500">{row.date}</Text>
          </View>
          <FormattedCurrency
            value={Math.abs(row.amount)}
            currency={currency}
            className="text-sm font-medium"
          />
        </View>
      ))}
      {preview.length > 10 && (
        <Text className="mt-2 text-center text-sm text-gray-500">
          {translate('import-export.more_rows', { count: preview.length - 10 })}
        </Text>
      )}
      <SolidButton
        className="mt-8"
        fullWidth
        disabled={!accountId || importing}
        label={
          importing
            ? translate('common.loading')
            : `${translate('import-export.import')} ${preview.length} ${translate('import-export.rows')}`
        }
        onPress={onImport}
      />
    </View>
  );
}

export type ImportProps = {
  state: {
    headers: string[];
    allRows: string[][];
    mapping: ColumnMapping;
  };
  setMapping: (m: ColumnMapping) => void;
  onClose: () => void;
};

export default function Import({ state, setMapping, onClose }: ImportProps) {
  const { headers, allRows, mapping } = state;
  const { data: accounts = [] } = useAccounts();
  const preferredCurrency = useAppStore.use.currency();
  const router = useRouter();
  const [step, setStep] = React.useState<Step>('map');
  const [importing, setImporting] = React.useState(false);
  const [preview, setPreview] = React.useState<ParsedRow[]>([]);
  const [accountId, setAccountId] = React.useState<string>(accounts[0]?.id ?? '');
  const createTransaction = useCreateTransaction();

  const runImport = async () => {
    if (!accountId) return;
    setImporting(true);
    let count = 0;
    for (const row of preview) {
      const type = row.type ?? (row.amount >= 0 ? ('income' as const) : ('expense' as const));
      await createTransaction.mutateAsync({
        account_id: accountId,
        amount: (type === 'transfer' ? row.amount : Math.abs(row.amount)) / 100,
        baseAmount: 0,
        baseCurrency: preferredCurrency,
        currency: row.currency ?? preferredCurrency,
        category_id: '_unknown',
        date: Math.floor(new Date(row.date).getTime() / 1000),
        note: row.note,
        type,
      });
      count++;
    }
    setImporting(false);
    Alert.alert(
      translate('import-export.complete_title'),
      translate('import-export.complete_message', { count }),
      [
        { onPress: () => router.back(), text: translate('common.ok') },
      ],
    );
  };

  const buildPreview = () => {
    if (mapping.date === null || mapping.amount === null) {
      Alert.alert(translate('common.error'), translate('import-export.date_amount_required'));
      return;
    }
    setPreview(mapRows(allRows, mapping, true));
    setStep('preview');
  };

  return (
    <>
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
          currency={preferredCurrency}
          importing={importing}
          preview={preview}
          onAccountSelect={setAccountId}
          onImport={runImport}
        />
      )}
      <OutlineButton className="mt-2" label={translate('common.cancel')} fullWidth onPress={onClose} />
    </>
  );
}

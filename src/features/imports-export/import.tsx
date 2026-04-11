import type { Account } from '../accounts/types';

import type { TransactionFormData } from '../transactions/types';
import type { ColumnMapping, ParsedRow, SkippedRow } from './csv-parser';

import { useRouter } from 'expo-router';

import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { Alert, FormattedCurrency, FormattedDate, GhostButton, Select, SolidButton, Text } from '@/components/ui';

import { translate } from '@/lib/i18n';
import { OutlineButton } from '../../components/ui/outline-button';
import { DEFAULT_CURRENCY } from '../../config';
import { useAppStore } from '../../lib/store';
import { useAccounts } from '../accounts/api';
import { useCategories } from '../categories/api';
import { useCreateTransactions } from '../transactions/api';
import { mapRows } from './csv-parser';

import { mapCategoryNameToId } from './helpers';

type Step = 'map' | 'preview';

const COLUMN_FIELDS: (keyof ColumnMapping)[] = ['date', 'amount', 'currency', 'note', 'type', 'category'];

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
  importing: number | undefined;
  onAccountSelect: (id: string) => void;
  onImport: () => void;
  preview: ParsedRow[];
  skipped: SkippedRow[];
};

const ITEMS_NUM = 10;
const MAX_SKIPPED = 5;
function PreviewStep({
  preview,
  accounts,
  accountId,
  onAccountSelect,
  onImport,
  importing,
  skipped,
}: PreviewStepProps) {
  const [show, setShow] = React.useState(ITEMS_NUM);
  const hasMore = preview.length > show;
  const totalSkipped = skipped.length;
  return (
    <View>
      <Text className="mb-4 text-xl font-medium">
        {`${translate('import-export.preview_title')} (${preview.length} ${translate('import-export.rows')})`}
      </Text>
      {accounts.length > 0 && (
        <>
          <Text className="font-medium text-muted-foreground">
            {translate('import-export.select_account')}
          </Text>
          <ScrollView horizontal contentContainerClassName="py-2 mb-4">
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
        </>
      )}
      {!!totalSkipped && (
        <View className="mb-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900">
          <Text className="mb-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {translate('import-export.skipped_warning', { count: totalSkipped })}
          </Text>
          {skipped.slice(0, MAX_SKIPPED).map((s, i) => (
            <View key={i} className="flex-row items-center justify-between py-0.5">
              <Text className="flex-1 text-xs text-amber-700 dark:text-amber-300" numberOfLines={1}>
                {s.note || '-'}
              </Text>
              <Text className="ml-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                {s.rawCurrency}
              </Text>
            </View>
          ))}
          {totalSkipped > MAX_SKIPPED && (
            <Text className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {translate('import-export.skipped_more', { count: totalSkipped - MAX_SKIPPED })}
            </Text>
          )}
        </View>
      )}
      {preview.slice(0, show).map((row) => (
        <View
          key={`${row.date}-${row.amount}`}
          className="mb-1 flex-row items-center justify-between rounded-lg bg-card p-2"
        >
          <View className="flex-1">
            <Text className="text-sm font-medium">
              {row.note || '- No note -'}
            </Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="text-xs text-gray-500">
                {row.categoryName || '?'}
                {' '}
                -
              </Text>
              <FormattedDate className="text-xs text-gray-500" value={new Date(row.date).getTime() / 1000} />
            </View>
          </View>
          <FormattedCurrency
            value={Math.abs(row.amount)}
            currency={row.currency ?? DEFAULT_CURRENCY}
            className="text-sm font-medium"
          />
        </View>
      ))}
      <View className="mt-2 flex-row items-center justify-between gap-4">
        {preview.length > ITEMS_NUM && (
          <Text className="text-sm text-muted-foreground">
            {translate('import-export.more_rows', { count: preview.length - show })}
          </Text>
        )}
        {hasMore && (
          <GhostButton
            size="xs"
            color="secondary"
            label={translate('common.show_more')}
            onPress={() => setShow((prev) => prev + ITEMS_NUM)}
            textClassName="underline"
          />
        )}
      </View>
      <SolidButton
        className="mt-10"
        fullWidth
        disabled={!accountId || importing !== undefined}
        label={
          importing
            ? `${translate('common.loading')} (${importing} / ${preview.length})`
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
  const router = useRouter();
  const { headers, allRows, mapping } = state;
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const preferredCurrency = useAppStore.use.currency();
  const [step, setStep] = React.useState<Step>('map');
  const [importing, setImporting] = React.useState<number | undefined>(undefined);
  const [preview, setPreview] = React.useState<ParsedRow[]>([]);
  const [skippedCurrencies, setSkippedCurrencies] = React.useState<SkippedRow[]>([]);
  const [accountId, setAccountId] = React.useState<string>(accounts[0]?.id ?? '');
  const createTransactions = useCreateTransactions();

  const runImport = async () => {
    if (!accountId || preview.length === 0) return;
    setImporting(0);
    const transactions: TransactionFormData[] = [];
    let count = 0;
    for (const row of preview) {
      const type = row.type ?? (row.amount >= 0 ? 'income' : 'expense');
      transactions.push({
        account_id: accountId,
        amount: Math.abs(row.amount) / 100,
        currency: row.currency ?? preferredCurrency,
        category_id: mapCategoryNameToId(row.categoryName, categories),
        date: Math.floor(new Date(row.date).getTime() / 1000),
        note: row.note,
        type,
      });
      count++;
      setImporting(count);
    }
    await createTransactions.mutateAsync(transactions);
    setImporting(undefined);
    Alert.alert(
      translate('import-export.complete_title'),
      translate('import-export.complete_message', { count: transactions.length }),
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
    const result = mapRows(allRows, mapping, true);
    setPreview(result.rows);
    setSkippedCurrencies(result.skipped);
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
          importing={importing}
          preview={preview}
          skipped={skippedCurrencies}
          onAccountSelect={setAccountId}
          onImport={runImport}
        />
      )}
      <OutlineButton className="mt-2" label={translate('common.cancel')} fullWidth onPress={onClose} />
    </>
  );
}

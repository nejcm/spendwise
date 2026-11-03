import type { ColumnMapping, ParsedRow, SkippedRow } from './csv-parser';

import * as React from 'react';
import { View } from 'react-native';
import { Alert, Checkbox, FormattedCurrency, FormattedDate, GhostButton, Select, SolidButton, Text } from '@/components/ui';

import { OutlineButton } from '@/components/ui/outline-button';
import { DEFAULT_CURRENCY } from '@/config';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { saveCsvMapping } from '@/lib/store/store';

import { csvHeaderSignature, mapRows } from './csv-parser';
import { useImportTransactions } from './hooks';

type Step = 'map' | 'preview';

const COLUMN_FIELDS: (keyof ColumnMapping)[] = ['date', 'amount', 'currency', 'note', 'type', 'category', 'account'];

type MapStepProps = {
  headers: string[];
  mapping: ColumnMapping;
  onMapping: (m: ColumnMapping) => void;
  onNext: () => void;
  loading?: boolean;
};

function MapStep({ headers, mapping, onMapping, onNext, loading }: MapStepProps) {
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
          <View className="min-w-32">
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
                const parsed = value === 'none' ? null : Number.parseInt(value);
                onMapping({
                  ...mapping,
                  [field]: parsed,
                  ...(field === 'currency' && parsed === null
                    ? { fallbackAmount: null, fallbackCurrency: null }
                    : {}),
                });
              }}
            />
          </View>
        </View>
      ))}
      {mapping.currency !== null && (
        <View className="mt-2 border-t border-border pt-4">
          <Text className="mb-3 text-sm font-medium text-muted-foreground">
            {translate('import-export.fallback_section_title')}
          </Text>
          <View className="mb-4 flex-row items-center justify-between gap-4">
            <View className="min-w-32">
              <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                {translate('import-export.field_fallback_amount')}
              </Text>
            </View>
            <View className="flex-1">
              <Select
                size="sm"
                value={mapping.fallbackAmount === null ? 'none' : String(mapping.fallbackAmount)}
                options={options}
                onSelect={(value) => {
                  onMapping({ ...mapping, fallbackAmount: value === 'none' ? null : Number.parseInt(value) });
                }}
              />
            </View>
          </View>
          <View className="mb-4 flex-row items-center justify-between gap-4">
            <View className="min-w-32">
              <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                {translate('import-export.field_fallback_currency')}
              </Text>
            </View>
            <View className="flex-1">
              <Select
                size="sm"
                value={mapping.fallbackCurrency === null ? 'none' : String(mapping.fallbackCurrency)}
                options={options}
                onSelect={(value) => {
                  onMapping({ ...mapping, fallbackCurrency: value === 'none' ? null : Number.parseInt(value) });
                }}
              />
            </View>
          </View>
        </View>
      )}
      <SolidButton
        color="primary"
        fullWidth
        className="mt-8"
        disabled={loading}
        label={translate('import-export.preview')}
        onPress={onNext}
      />
    </View>
  );
}

export type PreviewStepProps = {
  onImport: (rows: ParsedRow[]) => void;
  preview: ParsedRow[];
  skipped: SkippedRow[];
  loading?: boolean;
};

const ITEMS_NUM = 10;
const MAX_SKIPPED = 5;
function PreviewStep({
  preview,
  onImport,
  skipped,
  loading,
}: PreviewStepProps) {
  const [show, setShow] = React.useState(ITEMS_NUM);
  const [includeDuplicates, setIncludeDuplicates] = React.useState(false);
  const hasMore = preview.length > show;
  const totalSkipped = skipped.length;
  const duplicateCount = preview.filter((row) => row.isDuplicate).length;
  const toImport = includeDuplicates ? preview : preview.filter((row) => !row.isDuplicate);
  return (
    <View>
      <Text className="mb-4 text-xl font-medium">
        {`${translate('import-export.preview_title')} (${preview.length} ${translate('import-export.rows')})`}
      </Text>
      {!!totalSkipped && (
        <View className="mb-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900">
          <Text className="mb-1 text-sm font-medium text-yellow-900 dark:text-yellow-100">
            {translate('import-export.skipped_warning', { count: totalSkipped })}
          </Text>
          {skipped.slice(0, MAX_SKIPPED).map((s, i) => (
            <View key={i} className="flex-row items-center justify-between py-0.5">
              <Text className="flex-1 text-xs text-yellow-800 dark:text-yellow-200" numberOfLines={1}>
                {s.note || '-'}
              </Text>
              <Text className="ml-2 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                {s.rawCurrency}
              </Text>
            </View>
          ))}
          {totalSkipped > MAX_SKIPPED && (
            <Text className="mt-1 text-xs text-yellow-700 dark:text-yellow-500">
              {translate('import-export.skipped_more', { count: totalSkipped - MAX_SKIPPED })}
            </Text>
          )}
        </View>
      )}
      {duplicateCount > 0 && (
        <Checkbox
          className="mb-3"
          checked={includeDuplicates}
          onChange={setIncludeDuplicates}
          label={translate('import-export.include_duplicates', { count: duplicateCount })}
          accessibilityLabel={translate('import-export.include_duplicates', { count: duplicateCount })}
        />
      )}
      {preview.slice(0, show).map((row) => (
        <View
          key={`${row.date}-${row.amount}`}
          className={cn('mb-1 flex-row items-center justify-between rounded-lg bg-card p-2', row.isDuplicate && !includeDuplicates && 'opacity-50')}
        >
          <View className="flex-1">
            <Text className="text-sm font-medium">
              {row.note || '- No note -'}
            </Text>
            <View>
              <Text className="text-xs text-gray-500">
                {row.categoryName || '?'}
                {' '}
                ·
                {' '}
                {row.accountName || '?'}
              </Text>
              <FormattedDate className="text-xs text-gray-500" value={new Date(row.date).getTime() / 1000} />
              {row.isDuplicate && (
                <Text className="text-xs font-medium text-yellow-700 dark:text-yellow-500">
                  {translate('import-export.duplicate')}
                </Text>
              )}
            </View>
          </View>
          <FormattedCurrency
            value={Math.abs(row.amount)}
            currency={row.currency ?? DEFAULT_CURRENCY}
            className="font-medium"
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
        color="primary"
        className="mt-10"
        fullWidth
        disabled={loading || toImport.length === 0}
        label={
          loading
            ? `${translate('common.loading')}`
            : `${translate('import-export.import')} ${toImport.length} ${translate('import-export.rows')}`
        }
        onPress={() => onImport(toImport)}
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
  const [step, setStep] = React.useState<Step>('map');
  const [preview, setPreview] = React.useState<ParsedRow[]>([]);
  const [skippedCurrencies, setSkippedCurrencies] = React.useState<SkippedRow[]>([]);
  const { isLoading, isInitializing, onImport, markDuplicates } = useImportTransactions(
    () => saveCsvMapping(csvHeaderSignature(headers), mapping),
  );

  const buildPreview = async () => {
    if (mapping.date === null || mapping.amount === null) {
      Alert.alert(translate('common.error'), translate('import-export.date_amount_required'));
      return;
    }
    const result = mapRows(allRows, mapping, true);
    try {
      setPreview(await markDuplicates(result.rows));
    }
    catch (error) {
      Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
      return;
    }
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
          loading={isInitializing}
        />
      )}
      {step === 'preview' && (
        <PreviewStep
          preview={preview}
          skipped={skippedCurrencies}
          onImport={(rows) => onImport({ data: rows })}
          loading={isLoading || isInitializing}
        />
      )}
      <OutlineButton className="mt-2" label={translate('common.cancel')} fullWidth onPress={onClose} />
    </>
  );
}

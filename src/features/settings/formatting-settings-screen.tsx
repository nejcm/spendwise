import type { DateFormat, NumberFormat } from '../formatting/constants';
import type { OptionType } from '@/components/ui';
import * as React from 'react';
import { Card, ListRow, Options, SectionHeader, Text, useModalSheet, View } from '@/components/ui';
import { Check } from '@/components/ui/icon';
import { useLastCurrencyRatesFetchedAt } from '@/features/currencies/hooks';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { setCurrencyFormat, setDateFormat, setNumberFormat, useAppStore } from '@/lib/store/store';
import { CURRENCY_FORMAT_OPTIONS, DATE_FORMAT_OPTIONS, NUMBER_FORMAT_OPTIONS } from '../formatting/constants';
import { formatCurrency, formatDate, formatDateFull, formatNumber } from '../formatting/helpers';
import { CurrencyItem } from './components/currency-item';
import { SettingsPage } from './components/settings-page';
import { useSetMonthStartDay } from './hooks';

const SAMPLE_CENTS = 123456;
const SAMPLE_DATE = Date.UTC(2026, 1, 15) / 1000;

type SheetType = 'numberFormat' | 'dateFormat' | 'monthStartDay';

const MONTH_START_DAYS = Array.from({ length: 28 }, (_, i) => String(i + 1));

export function FormattingSettingsScreen() {
  const currency = useAppStore.use.currency();
  const currencyFormat = useAppStore.use.currencyFormat();
  const numberFormat = useAppStore.use.numberFormat();
  const dateFormat = useAppStore.use.dateFormat();
  const monthStartDay = useAppStore.use.monthStartDay();
  const setMonthStartDay = useSetMonthStartDay();
  const { data: ratesDate } = useLastCurrencyRatesFetchedAt();
  const sheet = useModalSheet();
  const [sheetType, setSheetType] = React.useState<SheetType>('numberFormat');

  const sheets: Record<SheetType, { options: OptionType[]; value: string; onSelect: (value: string) => void }> = {
    numberFormat: {
      options: NUMBER_FORMAT_OPTIONS.map((value) => ({ value, label: formatNumber(SAMPLE_CENTS / 100, value, 2, 2) })),
      value: numberFormat,
      onSelect: (value) => setNumberFormat(value as NumberFormat),
    },
    dateFormat: {
      options: DATE_FORMAT_OPTIONS.map((value) => ({ value, label: formatDateFull(SAMPLE_DATE, value) })),
      value: dateFormat,
      onSelect: (value) => setDateFormat(value as DateFormat),
    },
    monthStartDay: {
      options: MONTH_START_DAYS.map((value) => ({ value, label: value })),
      value: String(monthStartDay),
      onSelect: (value) => setMonthStartDay(Number(value)),
    },
  };
  const openSheet = (type: SheetType) => {
    setSheetType(type);
    sheet.present();
  };
  const onSelectOption = (option: OptionType) => {
    sheets[sheetType].onSelect(String(option.value));
    sheet.close();
  };

  return (
    <SettingsPage title={translate('settings.formatting')}>
      <SectionHeader title={translate('settings.formatting_preview')} />
      <View className="gap-1 rounded-card border border-accent-line bg-accent-soft px-4.5 py-4">
        <Text className="text-[32px]/8.75 font-bold tracking-tight tabular-nums" numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(-SAMPLE_CENTS, currency, { numberFormat, currencyFormat })}
        </Text>
        <Text className="text-sm text-muted-foreground">{translate('settings.formatting_preview_meta', { date: formatDateFull(SAMPLE_DATE, dateFormat) })}</Text>
      </View>

      <SectionHeader title={translate('settings.amounts')} />
      <Card accessibilityRole="radiogroup" accessibilityLabel={translate('settings.currency_format')} className="px-4">
        {CURRENCY_FORMAT_OPTIONS.map((value, index) => {
          const selected = value === currencyFormat;
          return (
            <ListRow
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={cn('min-h-12.5', index > 0 && 'border-t border-border')}
              title={<Text className="text-row tabular-nums">{formatCurrency(SAMPLE_CENTS, currency, { numberFormat, currencyFormat: value })}</Text>}
              trailing={selected && <Check size={20} strokeWidth={2.4} colorClassName="accent-accent" />}
              onPress={() => setCurrencyFormat(value)}
            />
          );
        })}
      </Card>

      <SectionHeader title={translate('settings.dates_and_currency')} />
      <Card className="px-4">
        <ListRow
          className="min-h-12.5"
          title={translate('settings.number_format')}
          trailing={<Text className="text-row text-muted-foreground tabular-nums">{sheets.numberFormat.options.find((o) => o.value === numberFormat)?.label}</Text>}
          chevron
          onPress={() => openSheet('numberFormat')}
        />
        <ListRow
          className="min-h-12.5 border-t border-border"
          title={translate('settings.date_format')}
          trailing={<Text className="text-row text-muted-foreground">{formatDateFull(SAMPLE_DATE, dateFormat)}</Text>}
          chevron
          onPress={() => openSheet('dateFormat')}
        />
        <ListRow
          className="min-h-12.5 border-t border-border"
          title={translate('settings.month_start_day')}
          trailing={<Text className="text-row text-muted-foreground tabular-nums">{monthStartDay}</Text>}
          chevron
          onPress={() => openSheet('monthStartDay')}
        />
        <CurrencyItem className="min-h-12.5 border-t border-border" />
      </Card>
      <Text className="px-1 pt-2.5 text-meta text-muted-foreground">
        {ratesDate
          ? translate('settings.currency_rates_note', { date: formatDate(ratesDate, dateFormat) })
          : translate('settings.currency_rates_note_none')}
      </Text>

      <Options ref={sheet.ref} options={sheets[sheetType].options} value={sheets[sheetType].value} onSelect={onSelectOption} />
    </SettingsPage>
  );
}

import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { Alert, Euro, Text, useModalSheet, View } from '@/components/ui';
import { CurrencySheet } from '@/features/currencies/components/currency-sheet';
import { useChangeCurrency, useLastCurrencyRatesFetchedAt } from '@/features/currencies/hooks';
import { formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { SettingsItem } from './settings-item';

export function CurrencyItem() {
  const modal = useModalSheet();
  const currency = useAppStore.use.currency();
  const dateFormat = useAppStore.use.dateFormat();
  const changeCurrency = useChangeCurrency();
  const { data: lastFetchedAt } = useLastCurrencyRatesFetchedAt();
  const lastRefreshed = lastFetchedAt
    ? formatDate(lastFetchedAt, dateFormat)
    : translate('settings.currency_rates_never_refreshed');

  const onSelect = React.useCallback(
    (newCurrency: CurrencyKey) => {
      if (newCurrency === currency) return;

      Alert.alert(
        translate('settings.changeCurrencyTitle'),
        translate('settings.changeCurrencyWarning'),
        [
          { text: translate('common.cancel'), style: 'cancel' },
          {
            text: translate('common.confirm'),
            onPress: () => {
              changeCurrency.mutate(newCurrency);
            },
          },
        ],
      );
    },
    [changeCurrency, currency],
  );

  return (
    <>
      <View>
        <SettingsItem text="common.currency" icon={<Euro colorClassName="accent-foreground" size={20} />} value={currency} onPress={modal.present} />
        <Text className="px-4 pb-3 text-sm text-muted-foreground">
          {translate('settings.currency_rates_last_refreshed', { date: lastRefreshed })}
        </Text>
      </View>
      <CurrencySheet ref={modal.ref} onSelect={onSelect} value={currency} />
    </>
  );
}

import type { OptionType } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { Euro, Options, Text, useModalSheet, View } from '@/components/ui';
import { useLastCurrencyRatesFetchedAt } from '@/features/currencies/hooks';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { setCurrency, useAppStore } from '@/lib/store/store';
import { SettingsItem } from './settings-item';

export function CurrencyItem() {
  const modal = useModalSheet();
  const currency = useAppStore.use.currency();
  const dateFormat = useAppStore.use.dateFormat();
  const { data: lastFetchedAt } = useLastCurrencyRatesFetchedAt();
  const lastRefreshed = lastFetchedAt
    ? formatDate(lastFetchedAt, dateFormat)
    : translate('settings.currency_rates_never_refreshed');

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setCurrency(option.value as CurrencyKey);
      modal.close();
    },
    [modal],
  );

  return (
    <>
      <View>
        <SettingsItem text="common.currency" icon={<Euro colorClassName="accent-foreground" size={20} />} value={currency} onPress={modal.present} />
        <Text className="px-4 pb-3 text-sm text-muted-foreground">
          {translate('settings.currency_rates_last_refreshed', { date: lastRefreshed })}
        </Text>
      </View>
      <Options ref={modal.ref} options={CURRENCY_OPTIONS} onSelect={onSelect} value={currency} />
    </>
  );
}

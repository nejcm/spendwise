import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { Modal } from 'react-native';
import { ActivityIndicator, Alert, FlagCircle, ListRow, Text, useModalSheet, View } from '@/components/ui';
import { CurrencySheet } from '@/features/currencies/components/currency-sheet';
import { useChangeCurrency } from '@/features/currencies/hooks';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

/** Preferred Currency row: confirms, then recalculates every stored total. */
export function CurrencyItem({ className }: { className?: string }) {
  const modal = useModalSheet();
  const currency = useAppStore.use.currency();
  const changeCurrency = useChangeCurrency();

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
      <ListRow
        className={className}
        title={translate('settings.preferred_currency')}
        trailing={(
          <View className="flex-row items-center gap-1.5">
            <FlagCircle currency={currency} />
            <Text className="text-row text-muted-foreground">{currency}</Text>
          </View>
        )}
        chevron
        onPress={modal.present}
      />
      <CurrencySheet ref={modal.ref} onSelect={onSelect} value={currency} />
      <Modal transparent visible={!!changeCurrency.isPending} statusBarTranslucent>
        <View className="flex-1 items-center justify-center bg-background/80">
          <ActivityIndicator size="large" />
        </View>
      </Modal>
    </>
  );
}

import type { OptionType } from '@/components/ui';
import type { LoaderDimensions } from '@/components/ui/skeleton';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { FormattedCurrency, getPressedStyle, Options, SolidButton, Text, useModalSheet, View } from '@/components/ui';
import { ChevronDown, TrendingDown, TrendingUp } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { useAccountSummaryDisplay } from '@/features/accounts/api';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

export type AccountSummaryProps = {
  accountId: string | undefined;
  startDate: number | undefined;
  endDate: number | undefined;
};

const loaderDimensions: LoaderDimensions = [['50%', 60], ['100%', 75]];

export function AccountSummary({ accountId, startDate, endDate }: AccountSummaryProps) {
  const preferredCurrency = useAppStore.use.currency();
  const [viewCurrency, setViewCurrency] = React.useState<CurrencyKey>(preferredCurrency);
  const modal = useModalSheet();

  const { data: summary, isLoading, isError } = useAccountSummaryDisplay(accountId, startDate, endDate, viewCurrency);

  const onSelectCurrency = React.useCallback(
    (option: OptionType) => {
      setViewCurrency(option.value as CurrencyKey);
      modal.close();
    },
    [modal],
  );

  const showSkeleton = isLoading || (isError && !summary);

  return (
    <View className="mx-4 mb-6 rounded-2xl bg-card p-4 px-4">
      <View className="mb-6">
        <SolidButton
          style={getPressedStyle}
          onPress={modal.present}
          accessibilityLabel={translate('accounts.view_currency')}
          className="mb-2 gap-1 rounded-full px-3"
          size="2xs"
          color="secondary"
        >
          <Text className="text-sm text-muted-foreground">{viewCurrency}</Text>
          <ChevronDown className="text-muted-foreground" size={16} />
        </SolidButton>
        {showSkeleton
          ? (
              <SkeletonRows count={2} dimensions={loaderDimensions} className="items-center justify-center" />
            )
          : summary
            ? (
                <FormattedCurrency value={summary.balance} currency={viewCurrency} className="text-center text-3xl font-medium" />
              )
            : null}
      </View>
      {summary && !showSkeleton && (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <View className="mb-1 flex-row items-center justify-center gap-2">
              <TrendingUp colorClassName="accent-green-600" size={16} />
              <Text className="text-center text-sm text-muted-foreground">{translate('common.income')}</Text>
            </View>
            <FormattedCurrency value={summary.income} currency={viewCurrency} className="text-center text-lg font-medium" numberOfLines={1} />
          </View>
          <View className="flex-1">
            <View className="mb-1 flex-row items-center justify-center gap-2">
              <TrendingDown colorClassName="accent-red-600" size={16} />
              <Text className="text-center text-sm text-muted-foreground">{translate('common.expenses')}</Text>
            </View>
            <FormattedCurrency value={summary.expense} currency={viewCurrency} prefix="- " className="text-center text-lg font-medium" numberOfLines={1} />
          </View>
        </View>
      )}
      <Options ref={modal.ref} options={CURRENCY_OPTIONS} onSelect={onSelectCurrency} value={viewCurrency} />
    </View>
  );
}

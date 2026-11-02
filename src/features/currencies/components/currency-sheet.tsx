import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { ModalSheetProps } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { withUniwind } from 'uniwind';
import { FlagCircle, getPressedStyle, ModalSheet, SectionHeader, Text } from '@/components/ui';
import { Check, Search } from '@/components/ui/icon';
import { CURRENCIES, CURRENCIES_MAP } from '@/features/currencies';
import { currencyRateText, recentCurrencies } from '@/features/currencies/helpers';
import { useCurrencyRates } from '@/features/currencies/hooks';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';

const SheetTextInput = withUniwind(BottomSheetTextInput);
const SNAP_POINTS = ['88%'];
const BY_NAME = [...CURRENCIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.value as CurrencyKey);

export type CurrencySheetProps = Pick<ModalSheetProps, 'stackBehavior'> & {
  ref: React.RefObject<BottomSheetModal | null>;
  value: CurrencyKey;
  onSelect: (currency: CurrencyKey) => void;
};

export function CurrencySheet({ ref, value, onSelect, stackBehavior }: CurrencySheetProps) {
  const preferred = useAppStore.use.currency();
  const lastUsed = useAppStore((s) => s.lastUsed.currencies);
  const [query, setQuery] = React.useState('');
  const recent = React.useMemo(() => recentCurrencies(preferred, lastUsed), [preferred, lastUsed]);

  const q = query.trim().toLowerCase();
  const all = q
    ? BY_NAME.filter((c) => c.toLowerCase().includes(q) || CURRENCIES_MAP[c].name.toLowerCase().includes(q))
    : BY_NAME.filter((c) => !recent.includes(c));

  const select = (currency: CurrencyKey) => {
    ref.current?.close();
    onSelect(currency);
  };

  return (
    <ModalSheet ref={ref} title={translate('common.currency')} snapPoints={SNAP_POINTS} stackBehavior={stackBehavior} onDismiss={() => setQuery('')}>
      <View className="mx-5 mt-2 h-12 flex-row items-center gap-2.5 rounded-full bg-card-2 px-4">
        <Search size={18} colorClassName="accent-muted-foreground" />
        <SheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder={translate('currencies.search')}
          placeholderTextColorClassName="accent-muted-foreground"
          accessibilityLabel={translate('currencies.search')}
          autoCorrect={false}
          className="min-w-0 flex-1 font-sans text-row text-foreground"
        />
      </View>
      <BottomSheetScrollView style={defaultStyles.transparentBg} keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pb-8">
        {!q && (
          <>
            <SectionHeader title={translate('currencies.recent')} className="px-0 pt-4 pb-1" />
            {recent.map((c) => <CurrencyRow key={c} currency={c} selected={c === value} onPress={select} />)}
          </>
        )}
        <SectionHeader title={translate('currencies.all')} className="px-0 pt-4 pb-1" />
        {all.map((c) => <CurrencyRow key={c} currency={c} selected={c === value} onPress={select} />)}
        {all.length === 0 && <Text className="py-4 text-meta text-muted-foreground">{translate('currencies.no_match')}</Text>}
      </BottomSheetScrollView>
    </ModalSheet>
  );
}

function CurrencyRow({ currency, selected, onPress }: { currency: CurrencyKey; selected: boolean; onPress: (c: CurrencyKey) => void }) {
  const preferred = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const { data: rates } = useCurrencyRates();
  const rate = currency === preferred
    ? translate('currencies.main_currency')
    : currencyRateText(currency, preferred, rates, { numberFormat, currencyFormat });
  const name = CURRENCIES_MAP[currency].name;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={[name, currency, rate].filter(Boolean).join(', ')}
      onPress={() => onPress(currency)}
      style={getPressedStyle}
      className="h-14.5 flex-row items-center gap-3"
    >
      <FlagCircle currency={currency} size={40} />
      <View className="min-w-0 flex-1">
        <Text className="text-row font-medium" numberOfLines={1}>{name}</Text>
        <Text className="text-meta text-muted-foreground" numberOfLines={1}>{rate ? `${currency} · ${rate}` : currency}</Text>
      </View>
      {selected && <Check size={20} strokeWidth={2.4} colorClassName="accent-accent" />}
    </Pressable>
  );
}

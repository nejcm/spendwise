import type { TransactionWithCategory } from '../types';
import type { UniwindLucideIcon } from '@/components/ui/icon';
import type { TransactionRule } from '@/features/scheduled-transactions/queries';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Linking, Platform, Pressable, View } from 'react-native';
import { DEFAULT_COLOR } from '@/components/color-selector';
import { AmountText, Card, Chip, FlagCircle, getPressedStyle, IconTile, ListRow, Text } from '@/components/ui';
import { Info } from '@/components/ui/icon';
import { useAccounts } from '@/features/accounts/api';
import { formatCurrency, formatDate } from '@/features/formatting/helpers';
import { FREQUENCY_OPTIONS } from '@/features/scheduled-transactions/constants';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { fxRateText, tagKey, transactionDisplayName } from '../helpers';
import { buildTransactionsHref } from '../route-params';
import { MerchantLogo } from './merchant-logo';

const HERO_DATE_FORMAT = 'EEEE, MMM d';
const SHORT_DATE_FORMAT = 'MMM d';

function isInflow(t: TransactionWithCategory) {
  return t.type === 'income' || (t.type === 'transfer' && t.amount > 0);
}

export function DetailHero({ transaction: t, onAmountPress }: { transaction: TransactionWithCategory; onAmountPress?: () => void }) {
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const isForeign = t.currency !== t.baseCurrency;
  const date = formatDate(t.date, HERO_DATE_FORMAT);
  const paid = isForeign
    ? translate('transactions.detail.paid', { amount: `${formatCurrency(Math.abs(t.amount), t.currency, { numberFormat, currencyFormat })} ${t.currency}` })
    : null;

  return (
    <View className="items-center px-5 pt-4">
      <IconTile color={t.category_color ?? DEFAULT_COLOR} className="size-17 rounded-hero">
        {t.merchant_logo_slug
          ? <MerchantLogo slug={t.merchant_logo_slug} size={36} withBg={false} />
          : <Text className="text-[32px]">{t.category_icon || (t.type === 'transfer' ? '⇄' : '?')}</Text>}
      </IconTile>
      <Text className="pt-2 text-center text-xl font-semibold" numberOfLines={2}>{transactionDisplayName(t)}</Text>
      <Pressable
        disabled={!onAmountPress}
        onPress={onAmountPress}
        accessibilityRole={onAmountPress ? 'button' : undefined}
        accessibilityHint={onAmountPress ? translate('transactions.detail.fx_note') : undefined}
        style={(state) => getPressedStyle(state, undefined, !!onAmountPress)}
      >
        <AmountText
          size="hero"
          value={Math.abs(t.baseAmount)}
          currency={t.baseCurrency}
          prefix={isInflow(t) ? '+' : '-'}
          className="text-[46px]/[54px]"
          centsClassName="text-[26px]"
        />
      </Pressable>
      <View className="flex-row items-center gap-1.5">
        {isForeign && <FlagCircle currency={t.currency} size={18} />}
        <Text className="text-sm text-muted-foreground">{[paid, date].filter(Boolean).join(' · ')}</Text>
      </View>
    </View>
  );
}

export function DetailRow({ label, value, first, onPress, full }: { label: string; value: string; first?: boolean; onPress?: () => void; full?: boolean }) {
  if (full) {
    return (
      <View className={cn('gap-1 py-3.5', !first && 'border-t border-border')}>
        <Text className="text-sm text-muted-foreground">{label}</Text>
        <Text className="text-[15px]" selectable>{value}</Text>
      </View>
    );
  }
  return (
    <ListRow
      className={cn('min-h-13', !first && 'border-t border-border')}
      onPress={onPress}
      chevron={!!onPress}
      title={<Text className="text-sm text-muted-foreground">{label}</Text>}
      trailing={<Text className="max-w-[65%] text-right text-[15px]" numberOfLines={2}>{value}</Text>}
    />
  );
}

function openMaps(location: string) {
  const q = encodeURIComponent(location);
  void Linking.openURL(Platform.select({ ios: `http://maps.apple.com/?q=${q}`, default: `geo:0,0?q=${q}` }));
}

export function DetailRows({ transaction: t, rule }: { transaction: TransactionWithCategory; rule?: TransactionRule | null }) {
  const router = useRouter();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const { data: accounts = [] } = useAccounts();
  const account = accounts.find((a) => a.id === t.account_id);
  const rate = fxRateText(t, { numberFormat, currencyFormat });
  const frequency = rule && FREQUENCY_OPTIONS.find((o) => o.value === rule.frequency)?.label;
  const withIcon = (icon: string | null | undefined, name: string | null) => `${icon ?? ''} ${name ?? ''}`.trim();

  const rows: { key: string; label: string; value: string; onPress?: () => void; full?: boolean }[] = [
    ...(t.category_id && t.category_name
      ? [{ key: 'category', label: translate('transactions.category'), value: withIcon(t.category_icon, t.category_name), onPress: () => router.push(`/categories/${t.category_id}?kind=${t.type}`) }]
      : []),
    { key: 'account', label: translate(t.counter_account_id ? (t.amount < 0 ? 'transactions.form.from' : 'transactions.form.to') : 'transactions.account'), value: withIcon(account?.icon, account?.name ?? t.account_name), onPress: () => router.push(`/accounts/${t.account_id}`) },
    ...(t.counter_account_id
      ? [{ key: 'counter', label: translate(t.amount < 0 ? 'transactions.form.to' : 'transactions.form.from'), value: withIcon(t.counter_account_icon, t.counter_account_name), onPress: () => router.push(`/accounts/${t.counter_account_id}`) }]
      : []),
    ...(rate ? [{ key: 'rate', label: translate('transactions.detail.exchange_rate'), value: translate('transactions.detail.rate_on', { rate, date: formatDate(t.date, SHORT_DATE_FORMAT) }) }] : []),
    ...(rule
      ? [{ key: 'rule', label: translate('transactions.detail.repeats'), value: rule.is_active ? translate('transactions.detail.repeats_value', { frequency: frequency ?? rule.frequency, date: formatDate(rule.next_due_date, SHORT_DATE_FORMAT) }) : `${frequency ?? rule.frequency} · ${translate('common.paused')}`, onPress: () => router.push(`/scheduled/${rule.id}`) }]
      : []),
    ...(t.location ? [{ key: 'where', label: translate('transactions.detail.where'), value: t.location, onPress: () => openMaps(t.location!) }] : []),
    ...(t.note ? [{ key: 'note', label: translate('transactions.note'), value: t.note, full: true }] : []),
  ];

  return (
    <Card className="mx-5 mt-6 rounded-card px-4.5">
      {rows.map(({ key, ...row }, i) => <DetailRow key={key} first={i === 0} {...row} />)}
      {t.tags.length > 0 && (
        <View className="gap-2 border-t border-border py-3.5">
          <Text className="text-sm text-muted-foreground">{translate('transactions.tags')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {t.tags.map((tag) => (
              <Chip key={tagKey(tag)} label={tag} onPress={() => router.push(buildTransactionsHref({ tags: [tag], periodSelection: { mode: 'all' } }))} />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

export function FxNote() {
  return (
    <View className="mx-5 mt-3 flex-row gap-3 rounded-[18px] border border-accent-line bg-accent-soft px-4 py-3.5">
      <Info size={17} colorClassName="accent-foreground" className="mt-0.5" />
      <Text className="flex-1 text-sm">{translate('transactions.detail.fx_note')}</Text>
    </View>
  );
}

export function DetailAction({ icon: Icon, label, onPress }: { icon: UniwindLucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={getPressedStyle}
      className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-card"
    >
      <Icon size={17} colorClassName="accent-foreground" />
      <Text className="text-[15px] font-medium">{label}</Text>
    </Pressable>
  );
}

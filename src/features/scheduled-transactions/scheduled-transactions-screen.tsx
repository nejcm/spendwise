import type { RuleGroup } from './helpers';
import type { ScheduledTransactionWithDetails } from './types';
import { addMonths, format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { AmountText, Card, FocusAwareStatusBar, IconTile, ListRow, ScrollView, SectionHeader, Text } from '@/components/ui';
import { ChevronLeft, Plus } from '@/components/ui/icon';
import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { SkeletonRows } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/features/formatting/helpers';
import { monthName } from '@/features/home/helpers';
import { cn } from '@/lib/cn';
import { useCurrentDay, useCurrentYearMonth } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { useScheduledTransactions, useToPreferred, useUpdateScheduledTransaction } from './api';
import { RecurringEmpty } from './components/recurring-empty';
import { FREQUENCY_OPTIONS } from './constants';
import { canResume, committedForMonth, daysUntil, groupRules, ruleToFormData, SOON_DAYS } from './helpers';

type ToPreferred = ReturnType<typeof useToPreferred>;

function monthLabel(yearMonth: string, today: string) {
  const [year, month] = yearMonth.split('-');
  const name = monthName(Number(month) - 1);
  return year === today.slice(0, 4) ? name : `${name} ${year}`;
}

function groupTitle(key: RuleGroup<unknown>['key'], today: string) {
  if (key === 'soon') return translate('scheduled.next_days', { count: SOON_DAYS });
  if (key === 'paused') return translate('common.paused');
  return translate('scheduled.later_in', { month: monthLabel(key.slice('month:'.length), today) });
}

export function ScheduledTransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const today = useCurrentDay();
  const yearMonth = useCurrentYearMonth();
  const { data: rules = [], isLoading } = useScheduledTransactions();
  const toPreferred = useToPreferred();
  const groups = React.useMemo(() => groupRules(rules, today), [rules, today]);
  const add = () => router.push('/scheduled/new');

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView
        className="flex-1"
        style={defaultStyles.transparentBg}
        contentContainerStyle={{ paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 16, flexGrow: 1 }}
      >
        <View pointerEvents="none" className="absolute inset-x-0 top-0 h-85 bg-linear-to-b from-wash to-background" />
        <View className="flex-1 px-5 pt-2">
          <PageHeader
            title={translate('scheduled.title')}
            left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router)} />}
            right={rules.length > 0 && <HeaderButton icon={Plus} label={translate('scheduled.add')} onPress={add} />}
          />
          {isLoading
            ? <SkeletonRows count={4} className="mt-5" />
            : rules.length === 0
              ? <RecurringEmpty onAdd={add} />
              : (
                  <>
                    <CommittedCard rules={rules} yearMonth={yearMonth} toPreferred={toPreferred} />
                    {groups.map((group) => (
                      <View key={group.key}>
                        <SectionHeader title={groupTitle(group.key, today)} />
                        {group.rules.map((rule) => <RuleRow key={rule.id} rule={rule} today={today} toPreferred={toPreferred} />)}
                      </View>
                    ))}
                  </>
                )}
        </View>
      </ScrollView>
    </>
  );
}

function CommittedCard({ rules, yearMonth, toPreferred }: { rules: ScheduledTransactionWithDetails[]; yearMonth: string; toPreferred: ToPreferred }) {
  const currency = useAppStore.use.currency();
  const nextMonth = format(addMonths(parseISO(`${yearMonth}-01`), 1), 'yyyy-MM');
  const { bills, comingIn, missingRate } = React.useMemo(() => committedForMonth(rules, nextMonth, toPreferred), [rules, nextMonth, toPreferred]);

  return (
    <Card variant="hero" className="mt-5 p-5">
      <Text className="text-row text-muted-foreground">{translate('scheduled.committed_for', { month: monthName(Number(nextMonth.slice(5)) - 1) })}</Text>
      <View className="mt-2 flex-row flex-wrap items-baseline gap-x-2">
        <AmountText size="hero" value={bills} currency={currency} />
        <Text className="text-row text-muted-foreground">{translate('scheduled.in_bills')}</Text>
      </View>
      <View className="mt-4 self-start rounded-tile bg-card-2 px-3.5 py-3">
        <Text className="text-meta text-muted-foreground">{translate('scheduled.coming_in')}</Text>
        <AmountText value={comingIn} currency={currency} prefix="+" className="font-semibold text-positive" />
      </View>
      {missingRate && <Text className="mt-3 text-meta text-muted-foreground">{translate('scheduled.committed_missing_rate')}</Text>}
    </Card>
  );
}

function RuleRow({ rule, today, toPreferred }: { rule: ScheduledTransactionWithDetails; today: string; toPreferred: ToPreferred }) {
  const router = useRouter();
  const preferred = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const updateMut = useUpdateScheduledTransaction();
  const converted = toPreferred(rule.amount, rule.currency);
  const isIncome = rule.type === 'income';
  const paused = !rule.is_active;
  const resumable = paused && canResume(rule, today);

  const frequency = FREQUENCY_OPTIONS.find((o) => o.value === rule.frequency)?.label ?? rule.frequency;
  const detail = paused
    ? translate(resumable ? 'common.paused' : 'scheduled.ended')
    : rule.currency !== preferred && converted != null
      ? `${formatCurrency(rule.amount, rule.currency, { numberFormat, currencyFormat })} ${rule.currency}`
      : rule.account_name;

  return (
    <ListRow
      className={cn(paused && 'opacity-60')}
      onPress={() => router.push(`/scheduled/${rule.id}`)}
      icon={<IconTile size="lg" color={rule.category_color} icon={rule.category_icon} />}
      title={rule.note || rule.category_name || translate('notifications.bill_default_name')}
      meta={[frequency, detail].filter(Boolean).join(' · ')}
      trailing={(
        <View className="items-end">
          <AmountText
            value={converted ?? rule.amount}
            currency={converted != null ? preferred : rule.currency}
            prefix={isIncome ? '+' : '-'}
            className={cn('font-semibold', isIncome && 'text-positive')}
          />
          {resumable
            ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => updateMut.mutate({ id: rule.id, data: ruleToFormData(rule, { is_active: true }) })}
                >
                  <Text className="text-meta font-semibold text-accent">{translate('scheduled.resume')}</Text>
                </Pressable>
              )
            : !paused && <DueText due={rule.next_due_date} today={today} />}
        </View>
      )}
    />
  );
}

function DueText({ due, today }: { due: number; today: string }) {
  const days = daysUntil(due, today);
  const soon = days === 0 || days === 1;
  const label = days === 0
    ? translate('common.today')
    : days === 1
      ? translate('common.tomorrow')
      : formatDate(due, days > 0 && days < SOON_DAYS ? 'EEE, MMM d' : 'MMM d');
  return <Text className={cn('text-meta', soon ? 'font-semibold text-accent' : 'text-muted-foreground')}>{label}</Text>;
}

import type { ScheduledTransactionWithDetails } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { AmountText, Card, FocusAwareStatusBar, getPressedStyle, GhostButton, IconTile, ListRow, PauseIcon, PlayIcon, SectionHeader, Switch, Text } from '@/components/ui';
import { ChevronLeft, Pencil } from '@/components/ui/icon';
import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { translateCount } from '@/features/categories/helpers';
import { formatDate, formatDateFull } from '@/features/formatting/helpers';
import { runUpcomingBillsCheck } from '@/features/notifications/notifications';
import { DetailAction, DetailRow } from '@/features/transactions/components/transaction-detail-parts';
import { captureError } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { unixToISODate } from '@/lib/date/helpers';
import { useCurrentDay } from '@/lib/hooks/use-current-year-month';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { getAppState, useAppStore } from '@/lib/store/store';
import {
  setBillRuleMuted,
  useDeleteScheduledTransaction,
  useRulePayments,
  useScheduledTransaction,
  useUpdateScheduledTransaction,
} from './api';
import { ScheduledTransactionForm } from './components/scheduled-transaction-form';
import { FREQUENCY_OPTIONS } from './constants';
import { canResume, daysUntil, ruleToFormData } from './helpers';

const HERO_DATE_FORMAT = 'EEE MMM d';
const SINCE_DATE_FORMAT = 'MMM d, yyyy';
const PAYMENT_DATE_FORMAT = 'MMM d';

function Wash() {
  return <View pointerEvents="none" className="absolute inset-x-0 top-0 h-85 bg-linear-to-b from-wash to-background" />;
}

function useMutedBillRule(ruleId: string) {
  const db = useSQLiteContext();
  const mutedIds = useAppStore((s) => s.notifications.mutedBillRules);
  const setMuted = (muted: boolean) => {
    setBillRuleMuted(ruleId, muted);
    // The daily processor may already have skipped this rule today.
    if (!muted) runUpcomingBillsCheck(db, getAppState().notifications).catch((error) => captureError(error instanceof Error ? error : new Error(String(error))));
  };
  return [!!mutedIds?.includes(ruleId), setMuted] as const;
}

export function ScheduledTransactionDetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = React.useState(false);
  const { data: rule, isLoading } = useScheduledTransaction(id);
  const deleteMut = useDeleteScheduledTransaction();
  const deletingRef = React.useRef(false);
  const updateMut = useUpdateScheduledTransaction();
  const today = useCurrentDay();

  if (isEditing && rule) {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
        <Wash />
        <ScheduledTransactionForm
          hasNav
          initialValues={{
            ...rule,
            amount: rule.amount / 100,
            is_active: Boolean(rule.is_active),
            start_date: unixToISODate(rule.start_date),
            end_date: rule.end_date ? unixToISODate(rule.end_date) : null,
          }}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      </View>
    );
  }

  const remove = () => {
    if (deletingRef.current) return;
    deletingRef.current = true;
    deleteMut.mutate(id, {
      onSuccess: () => goBackOrFallback(router, '/scheduled'),
      onSettled: () => { deletingRef.current = false; },
    });
  };

  const togglePause = () => {
    if (rule) updateMut.mutate({ id, data: ruleToFormData(rule, { is_active: !rule.is_active }) });
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <Wash />
      <View className="px-5 pt-2">
        <PageHeader
          left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router, '/scheduled')} />}
          right={rule && <HeaderButton icon={Pencil} label={translate('common.edit')} onPress={() => setIsEditing(true)} />}
        >
          <Text className="min-w-0 flex-1 text-center text-[15px] text-muted-foreground" numberOfLines={1}>
            {rule && translate(rule.type === 'income' ? 'scheduled.recurring_income' : 'scheduled.recurring_expense')}
          </Text>
        </PageHeader>
      </View>
      {isLoading
        ? <Text className="mt-10 text-center">{translate('common.loading')}</Text>
        : !rule
            ? <Text className="mt-10 px-5 text-center text-muted-foreground">{translate('scheduled.rule_not_found')}</Text>
            : (
                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: NAV_BAR_HEIGHT + insets.bottom + 16 }}>
                  <Hero rule={rule} today={today} />
                  <Rows rule={rule} />
                  <LastPayments ruleId={rule.id} />
                  {(rule.is_active || canResume(rule, today)) && (
                    <View className="mx-5 mt-3 flex-row">
                      <DetailAction
                        icon={rule.is_active ? PauseIcon : PlayIcon}
                        label={translate(rule.is_active ? 'scheduled.pause_rule' : 'scheduled.resume_rule')}
                        onPress={togglePause}
                      />
                    </View>
                  )}
                  <GhostButton color="danger" className="mt-4" textClassName="text-[15px] font-medium" label={translate('scheduled.delete_rule')} onPress={remove} />
                </ScrollView>
              )}
    </View>
  );
}

function Hero({ rule, today }: { rule: ScheduledTransactionWithDetails; today: string }) {
  const days = daysUntil(rule.next_due_date, today);
  const date = formatDateFull(rule.next_due_date, HERO_DATE_FORMAT);
  const when = days === 0
    ? `${translate('home.next_bill.today')}, ${date}`
    : days === 1 ? `${translate('home.next_bill.tomorrow')}, ${date}` : date;
  const status = !rule.is_active
    ? translate(canResume(rule, today) ? 'common.paused' : 'scheduled.ended')
    : translate('scheduled.next', { when });

  return (
    <View className="items-center px-5 pt-4">
      <IconTile color={rule.category_color} className="size-17 rounded-hero">
        <Text className="text-[32px]">{rule.category_icon ?? '🔁'}</Text>
      </IconTile>
      <Text className="pt-2 text-center text-xl font-semibold" numberOfLines={2}>{rule.note || rule.category_name}</Text>
      <AmountText
        size="hero"
        value={rule.amount}
        currency={rule.currency}
        prefix={rule.type === 'income' ? '+' : '-'}
        className={cn('text-[46px]/[54px]', rule.type === 'income' && 'text-positive')}
        centsClassName="text-[26px]"
      />
      <View className={cn('mt-1 rounded-full px-3.5 py-1.5', rule.is_active ? 'bg-accent-soft' : 'bg-card-2')}>
        <Text className={cn('text-sm font-semibold', rule.is_active ? 'text-accent' : 'text-muted-foreground')}>{status}</Text>
      </View>
    </View>
  );
}

function Rows({ rule }: { rule: ScheduledTransactionWithDetails }) {
  const router = useRouter();
  const notifications = useAppStore.use.notifications();
  const [muted, setMuted] = useMutedBillRule(rule.id);
  const remindersOn = !!notifications.global && notifications.upcomingBills !== false;
  const remindLabel = translateCount('scheduled.remind_before', notifications.upcomingBillsDays ?? 7);
  const withIcon = (icon: string | null, name: string | null) => `${icon ?? ''} ${name ?? ''}`.trim();
  const frequency = FREQUENCY_OPTIONS.find((o) => o.value === rule.frequency)?.label ?? rule.frequency;
  const since = formatDateFull(rule.start_date, SINCE_DATE_FORMAT);
  const ends = rule.end_date != null
    ? translate('scheduled.until', { date: formatDateFull(rule.end_date, SINCE_DATE_FORMAT) })
    : translate('scheduled.no_end_date');

  return (
    <Card className="mx-5 mt-6 rounded-card px-4.5">
      <DetailRow first label={translate('scheduled.repeats')} value={frequency} />
      <DetailRow
        label={translate(rule.type === 'income' ? 'transactions.form.to' : 'transactions.form.from')}
        value={withIcon(rule.account_icon, rule.account_name)}
        onPress={() => router.push(`/accounts/${rule.account_id}`)}
      />
      <DetailRow
        label={translate('transactions.category')}
        value={withIcon(rule.category_icon, rule.category_name)}
        onPress={() => router.push(`/categories/${rule.category_id}?kind=${rule.type}`)}
      />
      <DetailRow label={translate('scheduled.since')} value={`${since} · ${ends}`} />
      {rule.type === 'expense' && !!rule.is_active && (
        <ListRow
          className="min-h-13 border-t border-border"
          onPress={remindersOn ? undefined : () => router.push('/settings/notifications')}
          title={<Text className="text-sm text-muted-foreground">{remindLabel}</Text>}
          meta={remindersOn ? undefined : translate('scheduled.reminders_off')}
          trailing={(
            <Switch
              accessibilityLabel={remindLabel}
              checked={remindersOn && !muted}
              disabled={!remindersOn}
              onChange={(checked) => setMuted(!checked)}
            />
          )}
        />
      )}
    </Card>
  );
}

function LastPayments({ ruleId }: { ruleId: string }) {
  const router = useRouter();
  const { data: payments = [] } = useRulePayments(ruleId);
  if (payments.length === 0) return null;

  return (
    <View className="px-5">
      <SectionHeader title={translate('scheduled.last_payments')} />
      <View className="flex-row gap-2.5">
        {payments.map((payment) => (
          <Pressable
            key={payment.id}
            accessibilityRole="button"
            onPress={() => router.push(`/transactions/${payment.id}`)}
            style={getPressedStyle}
            className="flex-1 rounded-tile bg-card px-3.5 py-3"
          >
            <Text className="text-meta text-muted-foreground">{formatDate(payment.date, PAYMENT_DATE_FORMAT)}</Text>
            <AmountText value={Math.abs(payment.baseAmount)} currency={payment.baseCurrency} className="font-semibold" numberOfLines={1} adjustsFontSizeToFit />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

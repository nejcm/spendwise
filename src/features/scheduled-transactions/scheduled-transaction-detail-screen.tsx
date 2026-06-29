import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import DetailsSection, { DetailsRow } from '@/components/details';
import ScreenHeader from '@/components/screen-header';
import { Alert, FocusAwareStatusBar, FormattedCurrency, FormattedDate, OverflowMenu, PauseIcon, PlayIcon, SolidButton, Text, TrashIcon } from '@/components/ui';

import { GhostButton } from '@/components/ui/ghost-button';
import { formatDate } from '@/features/formatting/helpers';
import { unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';
import {
  useDeleteScheduledTransaction,
  useScheduledTransaction,
  useUpdateScheduledTransaction,
} from './api';
import { ScheduledTransactionForm } from './components/scheduled-transaction-form';

export function ScheduledTransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isCompact = useAppStore.use.density() === 'compact';
  const [isEditing, setIsEditing] = useState(false);
  const [showAuditTimestamps, setShowAuditTimestamps] = useState(false);

  const { data: rule, isLoading } = useScheduledTransaction(id ?? '');
  const deleteMut = useDeleteScheduledTransaction();
  const updateMut = useUpdateScheduledTransaction();

  if (isLoading) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('scheduled.title')} />
        <View className="flex-1 items-center justify-center bg-background">
          <Text>{translate('common.loading')}</Text>
        </View>
      </>
    );
  }

  if (!rule) {
    return (
      <>
        <FocusAwareStatusBar />
        <ScreenHeader title={translate('scheduled.title')} />
        <View className="flex-1 items-center justify-center gap-4 bg-background px-4">
          <Text className="text-center text-muted-foreground">
            {translate('scheduled.rule_not_found')}
          </Text>
          <GhostButton
            color="secondary"
            label={translate('common.back')}
            onPress={() => router.replace('/scheduled/index')}
          />
        </View>
      </>
    );
  }

  if (isEditing) {
    return (
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
    );
  }

  const handleDelete = () => {
    Alert.alert(
      translate('scheduled.remove'),
      translate('scheduled.remove_confirm'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteMut.mutateAsync(id);
              goBackOrFallback(router);
            }
          },
        },
      ],
    );
  };

  const handleTogglePause = async () => {
    if (!id) return;

    await updateMut.mutateAsync({
      id,
      data: {
        account_id: rule.account_id,
        category_id: rule.category_id,
        type: rule.type,
        amount: rule.amount / 100,
        currency: rule.currency,
        note: rule.note,
        frequency: rule.frequency,
        start_date: rule.start_date,
        end_date: rule.end_date,
        is_active: !rule.is_active,
      },
    });
  };
  const buttonSize = isCompact ? 'sm' : 'md';
  const title = rule.note?.trim() || translate('scheduled.title');

  return (
    <>
      <ScreenHeader
        title={title}
        prefix={!rule.is_active
          ? (
              <View className="mr-1 rounded-full bg-yellow-500/15 p-1.5">
                <PauseIcon size={15} colorClassName="accent-yellow-600" />
              </View>
            )
          : null}
      >
        <OverflowMenu
          className="-mr-2 ml-auto"
          accessibilityLabel={translate('settings.more')}
          items={[
            {
              label: rule.is_active ? translate('scheduled.pause') : translate('scheduled.resume'),
              onPress: handleTogglePause,
              icon: rule.is_active
                ? <PauseIcon size={16} colorClassName="accent-foreground" className="mr-2" />
                : <PlayIcon size={16} colorClassName="accent-foreground" className="mr-2" />,
            },
            {
              label: translate('common.delete'),
              onPress: handleDelete,
              className: 'text-danger-600',
              icon: <TrashIcon size={16} colorClassName="accent-danger-600" className="mr-2" />,
            },
          ]}
        />
      </ScreenHeader>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="flex-grow px-4 pt-7 pb-4">
        <View className="flex-1">
          <View className="items-center pb-6">
            <FormattedCurrency
              value={rule.amount}
              currency={rule.currency}
              prefix={rule.type === 'income' ? '+' : '-'}
              className={`text-3xl font-bold ${rule.type === 'income' ? 'text-success-600' : ''}`}
            />
            <Text className="mt-1 text-muted-foreground">
              {translate(`scheduled.frequencyOptions.${rule.frequency}`)}
              {' '}
              ·
              {' '}
              {formatDate(rule.next_due_date)}
            </Text>
          </View>

          <DetailsSection
            className="mb-4"
            growSide="right"
            data={[
              { label: translate('transactions.category'), value: rule.category_name ? `${rule.category_icon} ${rule.category_name}` : '-' },
              { label: translate('transactions.account'), value: rule.account_name ? `${rule.account_icon} ${rule.account_name}` : '-' },
              { label: translate('transactions.type'), value: rule.type, className: 'capitalize' },
              { label: translate('scheduled.next_due_date'), value: formatDate(rule.next_due_date) },
              { label: translate('common.start_date'), value: formatDate(rule.start_date) },
              { label: translate('common.end_date'), value: rule.end_date ? formatDate(rule.end_date) : '-' },
              { label: translate('scheduled.active'), value: rule.is_active ? translate('common.yes') : translate('common.no') },
              { label: translate('transactions.note'), value: rule.note || '-' },
            ]}
          >
            {showAuditTimestamps && (
              <View className="gap-3">
                <DetailsRow label={translate('transactions.created_at')} value={<FormattedDate value={rule.created_at} className="text-foreground" />} />
                <DetailsRow label={translate('transactions.updated_at')} value={<FormattedDate value={rule.updated_at} className="text-foreground" />} />
              </View>
            )}
            <View>
              <GhostButton
                size="sm"
                color="secondary"
                label={showAuditTimestamps ? translate('common.show_less') : translate('common.show_more')}
                onPress={() => setShowAuditTimestamps((v) => !v)}
                textClassName="underline"
              />
            </View>
          </DetailsSection>
        </View>
      </ScrollView>
      <View className="flex-row gap-2 px-4 py-2">
        <GhostButton
          label={translate('common.back')}
          onPress={() => goBackOrFallback(router)}
          textClassName="text-base/tight"
          size={buttonSize}
        />
        <SolidButton
          color="primary"
          className="flex-1"
          label={translate('common.edit')}
          onPress={() => setIsEditing(true)}
          textClassName="text-base/tight"
          size={buttonSize}
        />
      </View>
    </>
  );
}

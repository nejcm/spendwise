import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import DetailsSection from '@/components/details';
import { Alert, FocusAwareStatusBar, FormattedCurrency, FormattedDate, SolidButton, Text } from '@/components/ui';

import { GhostButton } from '@/components/ui/ghost-button';
import { OutlineButton } from '@/components/ui/outline-button';
import { formatDate } from '@/features/formatting/helpers';
import { unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import {
  useDeleteScheduledTransaction,
  useScheduledTransaction,
} from './api';
import { ScheduledTransactionForm } from './components/scheduled-transaction-form';

export function ScheduledTransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const { data: rule, isLoading } = useScheduledTransaction(id ?? '');
  const deleteMut = useDeleteScheduledTransaction();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text>{translate('common.loading')}</Text>
      </View>
    );
  }

  if (!rule) {
    return (
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
    );
  }

  if (isEditing) {
    return (
      <>
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-8">
          <ScheduledTransactionForm
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
        </ScrollView>
      </>
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
              router.back();
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-8">
        <View className="items-center pb-6">
          <FormattedCurrency
            value={rule.amount}
            currency={rule.currency}
            prefix={rule.type === 'income' ? '+' : '-'}
            className={`text-4xl font-bold ${rule.type === 'income' ? 'text-success-600' : ''}`}
          />
          <Text className="mt-1 text-gray-500">
            {translate(`scheduled.frequencyOptions.${rule.frequency}`)}
            {' '}
            ·
            {formatDate(rule.next_due_date)}
          </Text>
        </View>

        <DetailsSection
          className="mb-4"
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
        />
        <DetailsSection
          className="mb-8"
          data={[
            {
              label: translate('transactions.created_at'),
              value: <FormattedDate value={rule.created_at} className="text-foreground" />,
            },
            {
              label: translate('transactions.updated_at'),
              value: <FormattedDate value={rule.updated_at} className="text-foreground" />,
            },
          ]}
        />

        <View className="mb-6 justify-center">
          <OutlineButton
            label={translate('common.delete')}
            color="danger"
            onPress={handleDelete}
            className="rounded-3xl px-6"
            size="sm"
          />
        </View>

        <View className="flex-row gap-2">
          <GhostButton
            color="secondary"
            label={translate('common.back')}
            onPress={() => router.back()}
          />
          <SolidButton
            className="flex-1"
            label={translate('common.edit')}
            onPress={() => setIsEditing(true)}
          />
        </View>
      </ScrollView>
    </>
  );
}

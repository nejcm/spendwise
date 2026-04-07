import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import NoData from '@/components/no-data';
import { FocusAwareStatusBar, FormattedCurrency, ScrollView, SolidButton, Text } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { formatDate } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { defaultStyles } from '@/lib/theme/styles';
import { useScheduledTransactions } from './api';

export function ScheduledTransactionsScreen() {
  const router = useRouter();
  const { data: rules = [], isLoading } = useScheduledTransactions();

  const [activeRules, inactiveRules] = React.useMemo(() => {
    return [rules.filter((rule) => rule.is_active), rules.filter((rule) => !rule.is_active)];
  }, [rules]);

  if (isLoading) {
    return (
      <View className="flex-1 px-4 py-10">
        <SkeletonRows count={3} />
      </View>
    );
  }
  return (
    <>
      <FocusAwareStatusBar />
      {activeRules.length === 0 && inactiveRules.length === 0
        ? (
            <>
              <FocusAwareStatusBar />
              <NoData
                title={translate('scheduled.no_rules')}
                className="my-auto flex-1 py-6"
              >
                <SolidButton
                  color="primary"
                  label={translate('common.add')}
                  onPress={() => openSheet({ type: 'add-scheduled' })}
                  className="mt-4 min-w-24"
                  iconLeft={<Plus className="mr-2 text-background" size={16} />}
                />
              </NoData>
            </>
          )
        : (
            <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4" style={defaultStyles.transparentBg}>
              {activeRules.map((rule) => (
                <Pressable
                  key={rule.id}
                  className="mb-3 rounded-xl bg-card p-4"
                  onPress={() => router.push(`/scheduled/${rule.id}`)}
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1 gap-1">
                      {!!rule.note && (
                        <Text className="font-medium">
                          {rule.note}
                        </Text>
                      )}
                      <Text className={rule.note ? 'text-sm text-muted-foreground' : 'text-base font-semibold text-foreground'}>
                        {rule.category_icon ? `${rule.category_icon} ${rule.category_name}` : translate('common.none')}
                      </Text>
                    </View>
                    <FormattedCurrency
                      value={rule.amount}
                      currency={rule.currency}
                      prefix={rule.type === 'income' ? '+' : '-'}
                      className={`font-semibold ${rule.type === 'income' ? 'text-success-600' : 'text-danger-600'}`}
                    />
                  </View>
                  <Text className="text-sm text-muted-foreground">
                    {rule.account_icon}
                    {' '}
                    {rule.account_name}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    {translate(`scheduled.frequencyOptions.${rule.frequency}`)}
                    {' '}
                    ·
                    {' '}
                    {translate('common.next_on')}
                    {' '}
                    {formatDate(rule.next_due_date)}
                  </Text>
                </Pressable>
              ))}
              {inactiveRules.length > 0 && (
                <>
                  <Text className="mt-4 mb-2 text-sm font-medium text-gray-500">
                    {translate('common.completed')}
                  </Text>
                  {inactiveRules.map((rule) => (
                    <Pressable
                      key={rule.id}
                      className="mb-3 rounded-xl bg-card p-4 opacity-70"
                      onPress={() => router.push(`/scheduled/${rule.id}` as never)}
                    >
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1 gap-1">
                          <Text className="text-base font-semibold text-foreground">
                            {`${rule.category_icon ?? ''} ${rule.category_name ?? translate('common.none')}`.trim()}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {rule.account_icon}
                            {' '}
                            {rule.account_name}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {translate('scheduled.next_due_date')}
                            :
                            {' '}
                            {formatDate(rule.next_due_date)}
                          </Text>
                        </View>
                        <FormattedCurrency value={rule.amount} currency={rule.currency} className="font-semibold text-muted-foreground" />
                      </View>
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          )}
    </>
  );
}

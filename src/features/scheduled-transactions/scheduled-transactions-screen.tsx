import * as React from 'react';
import { View } from 'react-native';
import NoData from '@/components/no-data';
import { FocusAwareStatusBar, ScrollView, SolidButton } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { defaultStyles } from '@/lib/theme/styles';
import { useScheduledTransactions } from './api';
import ScheduledTransactionCard from './components/scheduled-transaction-card';

export function ScheduledTransactionsScreen() {
  const { data = [], isLoading } = useScheduledTransactions();

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
      {data.length === 0
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
                  size="sm"
                  iconLeft={<Plus className="mr-2 text-background" size={16} />}
                />
              </NoData>
            </>
          )
        : (
            <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4" style={defaultStyles.transparentBg}>
              {data.map((rule) => (
                <ScheduledTransactionCard key={rule.id} item={rule} />
              ))}
            </ScrollView>
          )}
    </>
  );
}

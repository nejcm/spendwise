import * as React from 'react';
import { View } from 'react-native';
import NoData from '@/components/no-data';
import ScreenHeader from '@/components/screen-header';
import { FocusAwareStatusBar, ScrollView, SolidButton } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { SkeletonRows } from '@/components/ui/skeleton';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/store/local-store';
import { defaultStyles } from '@/lib/theme/styles';
import { useScheduledTransactions } from './api';
import ScheduledTransactionCard from './components/scheduled-transaction-card';

export function ScheduledTransactionsScreen() {
  const { data = [], isLoading } = useScheduledTransactions();

  const openCreateScheduledForm = () => {
    openSheet({ type: 'add-scheduled' });
  };

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
      <ScreenHeader title={translate('scheduled.title')} />
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
                  onPress={openCreateScheduledForm}
                  className="mt-4 min-w-24"
                  size="sm"
                  iconLeft={<Plus className="mr-2 text-background" size={16} />}
                />
              </NoData>
            </>
          )
        : (
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pt-4 pb-6"
              style={defaultStyles.transparentBg}
            >
              {data.map((rule) => (
                <ScheduledTransactionCard key={rule.id} item={rule} />
              ))}
              <View className="mt-4 flex-row items-center justify-center">
                <SolidButton
                  iconLeft={<Plus className="mr-1 text-background" size={20} />}
                  label={translate('common.add')}
                  size="sm"
                  className="px-6"
                  onPress={openCreateScheduledForm}
                />
              </View>
            </ScrollView>
          )}
    </>
  );
}

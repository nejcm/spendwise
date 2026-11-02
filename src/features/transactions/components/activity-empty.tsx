import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { EmptyState, SolidButton, Text } from '@/components/ui';
import { Download, Plus, Sparkle } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

function Illustration() {
  return (
    <View className="h-32 w-42">
      <View className="absolute top-4.5 left-4.5 h-24 w-33 rotate-[-7deg] rounded-hero bg-card opacity-60" />
      <View className="absolute top-3 left-4.5 h-24 w-33 gap-2.5 rounded-hero bg-card p-4 shadow-lg shadow-black/10">
        <View className="flex-row items-center gap-2.5">
          <View className="size-6.5 rounded-lg bg-accent-soft" />
          <View className="h-2 flex-1 rounded-full bg-track" />
        </View>
        <View className="flex-row items-center gap-2.5">
          <View className="size-6.5 rounded-lg bg-track" />
          <View className="h-2 w-13 rounded-full bg-track" />
        </View>
      </View>
      <View className="absolute right-1.5 bottom-1 size-10 items-center justify-center rounded-full bg-primary">
        <Plus size={20} strokeWidth={2.2} colorClassName="accent-primary-foreground" />
      </View>
    </View>
  );
}

/** No transactions anywhere yet, as opposed to none matching the current Period or filters. */
export function ActivityEmpty() {
  const router = useRouter();
  const longPressAction = useAppStore.use.longPressAction();

  return (
    <View className="px-5 pt-18">
      <EmptyState
        icon={<Illustration />}
        title={translate('transactions.no_transactions')}
        body={translate('transactions.empty.body')}
        actions={(
          <>
            <SolidButton
              color="primary"
              size="lg"
              textClassName="font-semibold"
              label={translate('transactions.empty.add')}
              iconLeft={<Plus size={20} colorClassName="accent-primary-foreground" />}
              onPress={() => router.push('/transactions/new')}
            />
            <SolidButton
              color="secondary"
              size="lg"
              label={translate('transactions.empty.import')}
              iconLeft={<Download size={20} colorClassName="accent-foreground" />}
              onPress={() => router.push('/settings/import-export')}
            />
          </>
        )}
      />
      <View className="mt-5.5 flex-row gap-2.5 rounded-[18px] border border-accent-line bg-accent-soft px-4 py-3.5">
        <Sparkle size={16} colorClassName="accent-accent" className="mt-0.5" />
        <Text className="flex-1 text-sm/snug">{translate(`transactions.empty.tip_${longPressAction}`)}</Text>
      </View>
    </View>
  );
}

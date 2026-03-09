import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, View } from 'react-native';

import { FocusAwareStatusBar, ScrollView, Text } from '@/components/ui';
import { translate } from '@/lib/i18n';

import { useDeleteRecurringRule, useRecurringRules } from './api';
import { SubscriptionCard } from './components/subscription-card';

export function SubscriptionListScreen() {
  const router = useRouter();
  const { data: rules = [] } = useRecurringRules();
  const deleteRule = useDeleteRecurringRule();

  const handleDelete = (id: string, payee: string | null) => {
    Alert.alert(
      translate('subscriptions.remove'),
      `${translate('subscriptions.remove_confirm')} "${payee || translate('subscriptions.this_rule')}"?`,
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('subscriptions.remove'),
          style: 'destructive',
          onPress: () => deleteRule.mutate(id),
        },
      ],
    );
  };

  return (
    <View className="flex-1">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4">
        {rules.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-neutral-500">{translate('subscriptions.no_rules')}</Text>
          </View>
        )}
        {rules.map((rule) => (
          <SubscriptionCard
            key={rule.id}
            rule={rule}
            onDelete={() => handleDelete(rule.id, rule.payee)}
          />
        ))}
      </ScrollView>

      <Pressable
        className="absolute right-6 bottom-6 size-14 items-center justify-center rounded-full bg-primary-400 shadow-lg"
        onPress={() => router.push('/settings/subscriptions/create' as any)}
      >
        <Text className="text-2xl font-bold text-white">+</Text>
      </Pressable>
    </View>
  );
}

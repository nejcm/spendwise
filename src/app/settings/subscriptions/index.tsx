import { Stack } from 'expo-router';
import * as React from 'react';

import { SubscriptionListScreen } from '@/features/subscriptions/subscription-list-screen';
import { translate } from '@/lib/i18n';

export default function SubscriptionsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('subscriptions.title') }} />
      <SubscriptionListScreen />
    </>
  );
}

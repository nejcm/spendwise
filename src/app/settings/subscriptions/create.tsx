import { Stack } from 'expo-router';
import * as React from 'react';

import { SubscriptionCreateScreen } from '@/features/subscriptions/subscription-create-screen';
import { translate } from '@/lib/i18n';

export default function SubscriptionCreateRoute() {
  return (
    <>
      <Stack.Screen options={{ title: translate('subscriptions.create') }} />
      <SubscriptionCreateScreen />
    </>
  );
}

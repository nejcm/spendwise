import Env from 'env';
import * as React from 'react';

import { Pressable, Text, useModalSheet, View } from '@/components/ui';
import { AppInfoSheet } from './app-info-sheet';

export function AppInfoTrigger() {
  const modal = useModalSheet();

  return (
    <View>
      <Pressable onPress={modal.present} hitSlop={12}>
        <Text className="text-sm text-muted-foreground">
          {Env.EXPO_PUBLIC_NAME}
          {' '}
          v
          {Env.EXPO_PUBLIC_VERSION}
        </Text>
      </Pressable>
      <AppInfoSheet modal={modal} />
    </View>
  );
}

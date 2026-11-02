import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { View } from 'react-native';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { Image } from './image';

export type FlagCircleProps = {
  currency: CurrencyKey;
  size?: number;
  className?: string;
};

export function FlagCircle({ currency, size = 20, className }: FlagCircleProps) {
  return (
    <View className={className} style={{ width: size, height: size }} accessible={false}>
      <Image source={CURRENCY_IMAGES[currency]} className="size-full rounded-full bg-card-2" />
    </View>
  );
}

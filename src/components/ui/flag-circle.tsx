import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { CURRENCY_IMAGES } from '@/features/currencies/images';
import { cn } from '@/lib/cn';
import { Image } from './image';

export type FlagCircleProps = {
  currency: CurrencyKey;
  size?: number;
  className?: string;
};

export function FlagCircle({ currency, size = 20, className }: FlagCircleProps) {
  return (
    <Image
      source={CURRENCY_IMAGES[currency]}
      className={cn('rounded-full bg-card-2', className)}
      style={{ width: size, height: size }}
      accessible={false}
    />
  );
}

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

type Props = {
  hasError?: boolean;
  label: string;
  onComplete: (pin: string) => void;
};

export function PinPad({ onComplete, hasError = false, label }: Props) {
  const [pin, setPin] = useState('');

  const handleDigit = useCallback(
    (d: string) => {
      if (d === '⌫') {
        setPin((p) => p.slice(0, -1));
        return;
      }
      if (!d) {
        return;
      }
      const next = pin + d;
      if (next.length > 4) {
        return;
      }
      setPin(next);
      if (next.length === 4) {
        setPin('');
        onComplete(next);
      }
    },
    [pin, onComplete],
  );

  return (
    <View className="items-center">
      <Text className="mb-6 text-base font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </Text>

      <View className="mb-8 flex-row gap-5">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={`size-4 rounded-full border-2 ${
              i < pin.length
                ? hasError
                  ? 'border-red-500 bg-red-500'
                  : 'border-primary-400 bg-primary-400'
                : 'border-neutral-400 dark:border-neutral-500'
            }`}
          />
        ))}
      </View>

      <View className="gap-3">
        {ROWS.map((row, ri) => (
          <View key={ri} className="flex-row gap-3">
            {row.map((d, di) => (
              <Pressable
                key={di}
                onPress={() => handleDigit(d)}
                className={`size-16 items-center justify-center rounded-full ${
                  d ? 'bg-neutral-100 active:bg-neutral-200 dark:bg-neutral-800' : ''
                }`}
              >
                <Text className="text-xl font-medium">{d}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

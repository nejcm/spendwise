import type { AccountFormData, AccountType } from '../types';
import * as React from 'react';
import { useState } from 'react';

import { Pressable, View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';

import { translate } from '@/lib/i18n';

import { ACCOUNT_COLORS, ACCOUNT_TYPE_LABELS } from '../types';

type Props = {
  initialData?: AccountFormData;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
};

const ACCOUNT_TYPES: AccountType[] = ['cash', 'checking', 'savings', 'credit_card', 'investment', 'other'];

export function AccountForm({ initialData, onSubmit, onCancel, isSubmitting }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<AccountType>(initialData?.type ?? 'checking');
  const [balance, setBalance] = useState(initialData?.initial_balance ?? '0');
  const [color, setColor] = useState(initialData?.color ?? ACCOUNT_COLORS[0]);

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    onSubmit({
      name: name.trim(),
      type,
      currency: 'EUR',
      initial_balance: balance,
      icon: null,
      color,
    });
  };

  return (
    <View className="gap-4">
      <Input
        label={translate('accounts.name')}
        value={name}
        onChangeText={setName}
        placeholder={translate('accounts.name_placeholder')}
      />

      <View>
        <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {translate('accounts.type')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`rounded-full px-3 py-1.5 ${type === t ? 'bg-primary-400' : 'bg-neutral-100 dark:bg-neutral-700'}`}
            >
              <Text className={`text-sm ${type === t ? 'font-semibold text-white' : ''}`}>
                {ACCOUNT_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Input
        label={translate('accounts.opening_balance')}
        value={balance}
        onChangeText={setBalance}
        keyboardType="decimal-pad"
      />

      <View>
        <Text className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {translate('accounts.color')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {ACCOUNT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              className={`size-8 rounded-full ${color === c ? 'border-2 border-primary-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </View>
      </View>

      <View className="mt-2 flex-row gap-3">
        <Button
          label={translate('common.cancel')}
          variant="outline"
          onPress={onCancel}
          className="flex-1"
        />
        <Button
          label={translate('common.save')}
          onPress={handleSubmit}
          disabled={!name.trim() || isSubmitting}
          className="flex-1"
        />
      </View>
    </View>
  );
}

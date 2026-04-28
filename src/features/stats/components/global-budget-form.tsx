import { useForm } from '@tanstack/react-form';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as z from 'zod';

import { GhostButton, Input, SolidButton, Text } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import BottomSheetKeyboardAwareScrollView from '@/components/ui/modal-keyboard-aware-scroll-view';
import { centsToAmount } from '@/features/formatting/helpers';
import { parseToCents } from '@/lib/data/money';
import { translate } from '@/lib/i18n';
import { useSetGlobalBudget } from '../hooks';

const schema = z.object({
  amount: z
    .string()
    .min(1, translate('stats.global_budget_invalid'))
    .refine((v) => {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) && n > 0;
    }, translate('stats.global_budget_invalid')),
});

type Props = {
  currentAmountCents: number | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export function GlobalBudgetForm({ currentAmountCents, onSuccess, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const setGlobalBudget = useSetGlobalBudget();

  const form = useForm({
    defaultValues: {
      amount: currentAmountCents != null ? String(centsToAmount(currentAmountCents)) : '',
    },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      const cents = parseToCents(value.amount);
      if (cents == null) return;
      await setGlobalBudget.mutateAsync(cents);
      onSuccess();
    },
  });

  const handleClear = async () => {
    await setGlobalBudget.mutateAsync(null);
    onCancel();
  };

  return (
    <>
      <BottomSheetKeyboardAwareScrollView>
        <View className="px-4 pb-4">
          <form.Field
            name="amount"
            children={(field) => (
              <View>
                <Input
                  label={translate('stats.global_budget_monthly')}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder={translate('stats.global_budget_placeholder')}
                  keyboardType="decimal-pad"
                  size="lg"
                  autoFocus
                />
                {getFieldError(field) && (
                  <Text className="mt-1 text-sm text-danger-500">{getFieldError(field)}</Text>
                )}
              </View>
            )}
          />
        </View>
      </BottomSheetKeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: insets.bottom }}>
        <View className="flex-row gap-3 border-t border-border px-4 py-3">
          {currentAmountCents != null && (
            <GhostButton
              label={translate('stats.global_budget_clear')}
              color="danger"
              onPress={handleClear}
              loading={setGlobalBudget.isPending}
              className="flex-1"
            />
          )}
          <SolidButton
            label={translate('common.save')}
            color="primary"
            onPress={form.handleSubmit}
            loading={setGlobalBudget.isPending}
            className="flex-1"
          />
        </View>
      </KeyboardStickyView>
    </>
  );
}

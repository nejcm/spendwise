import type { WriteAction } from '@/features/ai/types';
import * as React from 'react';
import { GhostButton, SolidButton, Text, View } from '@/components/ui';
import { useFormatMoney } from '@/features/categories/hooks';
import { formatCurrency, formatDateFull } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';

type WriteConfirmationProps = {
  action: WriteAction;
  onConfirm: () => void;
  onCancel: () => void;
};

type Row = [label: string, value: string, key?: string];

function useRows(action: WriteAction): { title: string; rows: Row[] } {
  const formatMoney = useFormatMoney();
  const numberFormat = useAppStore((s) => s.numberFormat);
  const currencyFormat = useAppStore((s) => s.currencyFormat);
  const budgetLabel = (cents: number | null) => cents === null ? translate('categories.no_budget') : formatMoney(cents);

  switch (action.tool) {
    case 'set_category_budget':
      return {
        title: translate('ai.confirm_budget_title'),
        rows: [
          [translate('common.category'), action.categoryName],
          [translate('ai.confirm_budget_current'), budgetLabel(action.previousBudget)],
          [translate('ai.confirm_budget_new'), budgetLabel(action.budget)],
        ],
      };
    case 'recategorize_transactions':
      return {
        title: translate('ai.confirm_recategorize_title'),
        rows: [
          ...action.transactions.map((t): Row => [
            [formatDateFull(t.date), t.account_name, t.category_name ?? translate('transactions.unknown')].filter(Boolean).join(' · '),
            formatCurrency(Math.abs(t.amount), t.currency, { numberFormat, currencyFormat }),
            t.id,
          ]),
          [translate('ai.confirm_move_to'), action.categoryName],
        ],
      };
    case 'create_recurring_rule': {
      const { rule } = action;
      const rows: Row[] = [
        [translate('transactions.type'), translate(`common.${rule.type}`)],
        [translate('common.amount'), formatCurrency(action.amount, rule.currency, { numberFormat, currencyFormat })],
        [translate('transactions.account'), action.accountName],
        [translate('common.category'), action.categoryName],
        [translate('scheduled.repeats'), translate(`scheduled.frequencyOptions.${rule.frequency}`)],
        [translate('scheduled.form.starts'), formatDateFull(rule.start_date)],
      ];
      if (rule.note) rows.push([translate('common.note'), rule.note]);
      return { title: translate('ai.confirm_rule_title'), rows };
    }
  }
}

export function WriteConfirmation({ action, onConfirm, onCancel }: WriteConfirmationProps) {
  const { title, rows } = useRows(action);

  return (
    <View className="gap-3 rounded-card border border-accent-line bg-card px-4 py-3.5">
      <Text className="text-row font-semibold">{title}</Text>
      <View className="gap-1.5">
        {rows.map(([label, value, key = label]) => (
          <View key={key} className="flex-row justify-between gap-3">
            <Text className="text-meta text-muted-foreground">{label}</Text>
            <Text className="shrink text-right text-meta font-medium">{value}</Text>
          </View>
        ))}
      </View>
      <Text className="text-xs text-muted-foreground">{translate('ai.confirm_hint')}</Text>
      <View className="flex-row justify-end gap-2">
        <GhostButton size="sm" color="default" label={translate('common.cancel')} onPress={onCancel} />
        <SolidButton size="sm" color="primary" label={translate('common.confirm')} onPress={onConfirm} />
      </View>
    </View>
  );
}

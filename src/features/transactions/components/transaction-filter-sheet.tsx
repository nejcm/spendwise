import type { FilterState, TransactionSort } from '../types';
import type { ModalSheetRef } from '@/components/ui/modal-sheet';
import { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { View } from 'react-native';
import { withUniwind } from 'uniwind';
import { Chip, SegmentedControl, SolidButton, Text } from '@/components/ui';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { useAccounts } from '@/features/accounts/hooks';
import { useCategories } from '@/features/categories/api';
import { CURRENCIES_MAP } from '@/features/currencies';
import { formatMajorUnitsInputFromCents } from '@/features/formatting/helpers';
import { parseToCents } from '@/lib/data';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { DEFAULT_FILTERS, SORT_OPTIONS } from '../filters';

const SNAP_POINTS = ['88%'];
const SheetTextInput = withUniwind(BottomSheetTextInput);

type Draft = Omit<FilterState, 'minAmount' | 'maxAmount'> & { min: string; max: string };

function toDraft({ minAmount, maxAmount, ...rest }: FilterState): Draft {
  return {
    ...rest,
    min: minAmount === null ? '' : formatMajorUnitsInputFromCents(minAmount),
    max: maxAmount === null ? '' : formatMajorUnitsInputFromCents(maxAmount),
  };
}

function parseBound(value: string): number | null {
  const cents = parseToCents(value.replace(',', '.'));
  return cents !== null && cents >= 0 ? cents : null;
}

const fromDraft = ({ min, max, ...rest }: Draft): FilterState => ({ ...rest, minAmount: parseBound(min), maxAmount: parseBound(max) });

function toggle(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

export type TransactionFilterSheetProps = {
  ref?: ModalSheetRef<any>;
  filters: FilterState;
  /** Result count for a draft, from the same predicate the list uses. */
  countFor: (filters: FilterState) => number;
  onApply: (filters: FilterState) => void;
};

export function TransactionFilterSheet({ ref, filters, countFor, onApply }: TransactionFilterSheetProps) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const symbol = CURRENCIES_MAP[useAppStore.use.currency()]?.symbol ?? '';
  const [draft, setDraft] = React.useState(() => toDraft(filters));
  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));
  const count = countFor(fromDraft(draft));
  const activeAccounts = accounts.filter((a) => !a.is_archived || draft.accountIds.includes(a.id));
  const sortOptions = SORT_OPTIONS.map((value) => ({ value, label: translate(`transactions.filter.sort.${value}`) }));

  return (
    <ModalSheet
      ref={ref}
      snapPoints={SNAP_POINTS}
      title={translate('common.filters')}
      onChange={(index) => index >= 0 && setDraft(toDraft(filters))}
    >
      <View className="flex-1">
        <BottomSheetScrollView className="flex-1" contentContainerClassName="px-5 pb-4" keyboardShouldPersistTaps="handled">
          <SectionTitle title={translate('transactions.filter.sort_by')} />
          <SegmentedControl<TransactionSort>
            options={sortOptions}
            value={draft.sort}
            onChange={(sort) => patch({ sort })}
            accessibilityLabel={translate('transactions.filter.sort_by')}
          />

          {activeAccounts.length > 0 && (
            <>
              <SectionTitle title={translate('transactions.filter.accounts')} />
              <View className="flex-row flex-wrap gap-2">
                {activeAccounts.map((account) => (
                  <Chip
                    key={account.id}
                    tone="solid"
                    label={account.name}
                    icon={account.icon}
                    selected={draft.accountIds.includes(account.id)}
                    onPress={() => patch({ accountIds: toggle(draft.accountIds, account.id) })}
                  />
                ))}
              </View>
            </>
          )}

          <SectionTitle
            title={translate('transactions.filter.categories')}
            aside={draft.categoryIds.length > 0 ? translate('transactions.selected_count', { count: draft.categoryIds.length }) : undefined}
          />
          <View className="flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <Chip
                key={category.id}
                tone="solid"
                label={category.name}
                icon={category.icon}
                selected={draft.categoryIds.includes(category.id)}
                onPress={() => patch({ categoryIds: toggle(draft.categoryIds, category.id) })}
              />
            ))}
          </View>

          <SectionTitle title={translate('transactions.filter.amount')} />
          <View className="flex-row gap-2.5">
            <AmountBound label={translate('transactions.filter.from')} a11yLabel={translate('transactions.filter.min_amount')} symbol={symbol} value={draft.min} onChange={(min) => patch({ min })} />
            <AmountBound label={translate('transactions.filter.to')} a11yLabel={translate('transactions.filter.max_amount')} symbol={symbol} value={draft.max} onChange={(max) => patch({ max })} />
          </View>
        </BottomSheetScrollView>
        <View className="flex-row gap-2.5 px-5 pt-3 pb-4">
          <SolidButton
            color="tonal"
            size="lg"
            label={translate('transactions.filter.reset')}
            onPress={() => setDraft(toDraft({ ...DEFAULT_FILTERS, type: draft.type }))}
          />
          <SolidButton
            color="primary"
            size="lg"
            className="flex-1"
            textClassName="font-semibold"
            label={count === 1 ? translate('transactions.filter.show_one') : translate('transactions.filter.show_many', { count })}
            onPress={() => onApply(fromDraft(draft))}
          />
        </View>
      </View>
    </ModalSheet>
  );
}

function SectionTitle({ title, aside }: { title: string; aside?: string }) {
  return (
    <View className="flex-row items-baseline justify-between pt-5 pb-2.5">
      <Text className="text-sm font-semibold">{title}</Text>
      {aside && <Text className="text-meta text-muted-foreground">{aside}</Text>}
    </View>
  );
}

function AmountBound({ label, a11yLabel, symbol, value, onChange }: { label: string; a11yLabel: string; symbol: string; value: string; onChange: (value: string) => void }) {
  return (
    <View className="h-14 flex-1 justify-center rounded-2xl bg-card-2 px-4">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <View className="flex-row items-center">
        {value.length > 0 && <Text className="text-base">{symbol}</Text>}
        <SheetTextInput
          value={value}
          onChangeText={onChange}
          placeholder={translate('transactions.filter.any')}
          placeholderTextColorClassName="accent-muted-foreground"
          keyboardType="decimal-pad"
          accessibilityLabel={a11yLabel}
          className="min-w-0 flex-1 p-0 font-sans text-base text-foreground"
        />
      </View>
    </View>
  );
}

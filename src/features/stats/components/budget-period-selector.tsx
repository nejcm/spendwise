import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { BudgetPeriodSelection } from '../types';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { parseISO } from 'date-fns';
import * as React from 'react';
import { View } from 'react-native';
import { GhostButton, ModalSheet, OutlineButton, SolidButton, Text, useModalSheet } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { ArrowLeftIcon, ArrowRightIcon, ChevronRight } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { todayISO } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { budgetPeriodLabel, defaultBudgetPeriodSelection } from '../helpers';

// TODO: consolidate with period-selector.tsx

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_LIST = Array.from({ length: CURRENT_YEAR + 5 - 1989 }, (_, i) => CURRENT_YEAR + 5 - i);
const BUDGET_MODES: { key: BudgetPeriodSelection['mode']; label: string }[] = [
  { key: 'day', label: translate('common.day') },
  { key: 'month', label: translate('common.month') },
  { key: 'year', label: translate('common.year') },
  { key: 'range', label: translate('stats.budget_range') },
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type SelectorProps = {
  selection: BudgetPeriodSelection;
  onChange: (s: BudgetPeriodSelection) => void;
};

export function BudgetPeriodSelector({ selection, onChange }: SelectorProps) {
  const { ref, present } = useModalSheet();

  return (
    <>
      <GhostButton
        fullWidth
        size="md"
        onPress={present}
        hitSlop={12}
        textClassName="text-lg"
        className="flex-row items-center gap-2"
        label={budgetPeriodLabel(selection)}
        iconRight={<ChevronRight size={16} colorClassName="accent-foreground" />}
      />
      <BudgetPeriodSelectorModal ref={ref} selection={selection} onApply={onChange} />
    </>
  );
}

type ModalProps = {
  selection: BudgetPeriodSelection;
  onApply: (s: BudgetPeriodSelection) => void;
  ref?: React.RefObject<BottomSheetModal | null>;
};

function BudgetPeriodSelectorModal({ ref, selection, onApply }: ModalProps) {
  const modal = useModalSheet();
  const isCompact = useAppStore.use.density() === 'compact';
  const [draft, setDraft] = React.useState<BudgetPeriodSelection>(selection);

  const handlePresent = React.useCallback(() => {
    setDraft(selection);
    modal.present();
  }, [selection, modal]);

  React.useImperativeHandle(ref, () => ({
    present: handlePresent,
    close: modal.close,
  } as BottomSheetModal), [handlePresent, modal.close]);

  const switchMode = React.useCallback((mode: BudgetPeriodSelection['mode']) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (mode === 'day') {
      setDraft({ mode: 'day', date: draft.mode === 'day' ? draft.date : todayISO() });
    }
    else if (mode === 'month') {
      const day = draft.mode === 'day' ? parseISO(draft.date) : null;
      const year = draft.mode === 'range' ? draft.startYear : 'year' in draft ? draft.year : (day?.getFullYear() ?? currentYear);
      const month = draft.mode === 'month' ? draft.month : day != null ? day.getMonth() + 1 : currentMonth;
      setDraft({ mode: 'month', year, month });
    }
    else if (mode === 'year') {
      const day = draft.mode === 'day' ? parseISO(draft.date) : null;
      const year = draft.mode === 'range' ? draft.startYear : 'year' in draft ? draft.year : (day?.getFullYear() ?? currentYear);
      setDraft({ mode: 'year', year });
    }
    else {
      const startYear = draft.mode === 'range' ? draft.startYear : currentYear;
      const startMonth = draft.mode === 'range' ? draft.startMonth : 1;
      const endYear = draft.mode === 'range' ? draft.endYear : currentYear;
      const endMonth = draft.mode === 'range' ? draft.endMonth : currentMonth;
      setDraft({ mode: 'range', startYear, startMonth, endYear, endMonth });
    }
  }, [draft]);

  const handleApply = React.useCallback(() => {
    onApply(draft);
    modal.close();
  }, [draft, onApply, modal]);

  const handleClear = React.useCallback(() => {
    onApply(defaultBudgetPeriodSelection());
    modal.close();
  }, [onApply, modal]);

  const buttonSize = isCompact ? 'sm' : 'md';

  return (
    <ModalSheet ref={modal.ref} title={translate('stats.budget_select_period')} snapPoints={['75%']}>
      <View className="flex-1 px-4 pt-2">
        <View className="mb-6 flex-row flex-wrap gap-2">
          {BUDGET_MODES.map(({ key, label }) => (
            <View key={key} className="min-w-[45%] flex-1">
              <OutlineButton
                className={`items-center px-1 ${draft.mode === key ? '' : 'border-border'}`}
                textClassName={`text-sm ${draft.mode === key ? '' : 'text-muted-foreground'}`}
                fullWidth
                label={label}
                onPress={() => switchMode(key)}
                size={buttonSize}
              />
            </View>
          ))}
        </View>

        <View className="flex-1">
          {draft.mode === 'year' && (
            <YearBody
              selectedYear={draft.year}
              onSelect={(year) => setDraft({ mode: 'year', year })}
            />
          )}
          {draft.mode === 'month' && (
            <MonthBody
              year={draft.year}
              month={draft.month}
              onChangeYear={(year) => setDraft({ ...draft, year })}
              onChangeMonth={(month) => setDraft({ ...draft, month })}
            />
          )}
          {draft.mode === 'day' && (
            <DayBody
              date={draft.date}
              onChangeDate={(date) => setDraft({ mode: 'day', date })}
            />
          )}
          {draft.mode === 'range' && (
            <RangeBody draft={draft} onChange={setDraft} />
          )}
        </View>

        <View className="flex-row items-center justify-center gap-2 py-4">
          <GhostButton
            label={translate('common.clear')}
            onPress={handleClear}
            size="sm"
            textClassName="underline"
          />
          <SolidButton
            color="primary"
            label={translate('common.apply')}
            className="flex-1"
            size="sm"
            onPress={handleApply}
          />
        </View>
      </View>
    </ModalSheet>
  );
}

function YearNavRow({ year, onChangeYear }: { year: number; onChangeYear: (y: number) => void }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <IconButton size="sm" color="none" onPress={() => onChangeYear(year - 1)} hitSlop={12}>
        <ArrowLeftIcon className="text-muted-foreground" size={20} />
      </IconButton>
      <Text className="text-base font-semibold">{year}</Text>
      <IconButton size="sm" color="none" onPress={() => onChangeYear(year + 1)} hitSlop={12}>
        <ArrowRightIcon className="text-muted-foreground" size={20} />
      </IconButton>
    </View>
  );
}

function MonthGrid({ selectedMonth, onSelect }: { selectedMonth: number; onSelect: (m: number) => void }) {
  return (
    <View className="mt-3 flex-row flex-wrap justify-evenly gap-2">
      {MONTH_LABELS.map((label, i) => {
        const m = i + 1;
        const selected = m === selectedMonth;
        return (
          <GhostButton
            key={m}
            onPress={() => onSelect(m)}
            className={`w-[31%] ${selected ? 'bg-muted' : ''}`}
            textClassName={`${selected ? '' : 'font-normal text-muted-foreground'} uppercase`}
            label={label}
          />
        );
      })}
    </View>
  );
}

function MonthBody({
  year,
  month,
  onChangeYear,
  onChangeMonth,
}: {
  year: number;
  month: number;
  onChangeYear: (y: number) => void;
  onChangeMonth: (m: number) => void;
}) {
  return (
    <BottomSheetScrollView>
      <YearNavRow year={year} onChangeYear={onChangeYear} />
      <MonthGrid selectedMonth={month} onSelect={onChangeMonth} />
    </BottomSheetScrollView>
  );
}

function YearBody({ selectedYear, onSelect }: { selectedYear: number; onSelect: (y: number) => void }) {
  return (
    <BottomSheetScrollView>
      <View className="flex-row flex-wrap justify-evenly gap-2">
        {YEAR_LIST.map((year) => (
          <GhostButton
            key={year}
            className={`w-[30%] rounded-xl px-4 py-3 ${year === selectedYear ? 'bg-muted' : ''}`}
            onPress={() => onSelect(year)}
            textClassName={year === selectedYear ? '' : 'font-normal text-muted-foreground'}
            label={year.toString()}
          />
        ))}
      </View>
    </BottomSheetScrollView>
  );
}

function DayBody({ date, onChangeDate }: { date: string; onChangeDate: (d: string) => void }) {
  return (
    <View className="pt-2">
      <DateInput label={translate('common.day')} value={date} onChange={onChangeDate} size="lg" />
    </View>
  );
}

type RangeDraft = Extract<BudgetPeriodSelection, { mode: 'range' }>;

function RangeBody({ draft, onChange }: { draft: RangeDraft; onChange: (d: RangeDraft) => void }) {
  const clampEnd = React.useCallback((d: RangeDraft): RangeDraft => {
    const startTotal = d.startYear * 12 + d.startMonth;
    const endTotal = d.endYear * 12 + d.endMonth;
    if (endTotal < startTotal) {
      return { ...d, endYear: d.startYear, endMonth: d.startMonth };
    }
    return d;
  }, []);

  return (
    <BottomSheetScrollView>
      <Text className="mb-1 text-xs font-medium text-muted-foreground uppercase">
        {translate('common.start_date')}
      </Text>
      <YearNavRow
        year={draft.startYear}
        onChangeYear={(startYear) => onChange(clampEnd({ ...draft, startYear }))}
      />
      <MonthGrid
        selectedMonth={draft.startMonth}
        onSelect={(startMonth) => onChange(clampEnd({ ...draft, startMonth }))}
      />
      <View className="my-4 h-px bg-muted" />
      <Text className="mb-1 text-xs font-medium text-muted-foreground uppercase">
        {translate('common.end_date')}
      </Text>
      <YearNavRow
        year={draft.endYear}
        onChangeYear={(endYear) => onChange(clampEnd({ ...draft, endYear }))}
      />
      <MonthGrid
        selectedMonth={draft.endMonth}
        onSelect={(endMonth) => onChange(clampEnd({ ...draft, endMonth }))}
      />
    </BottomSheetScrollView>
  );
}

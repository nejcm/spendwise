import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { DynamicPeriodMode } from '@/lib/date/period-modes';
import type { PeriodMode, PeriodSelection } from '@/lib/store/store';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import * as React from 'react';
import { View } from 'react-native';
import { ModalSheet, OutlineButton, SolidButton, Text, useModalSheet } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { currentISOWeek, getWeeksInYear, isDynamicPeriodMode } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';

import { setPeriodSelection } from '@/lib/store/store';
import { todayISO } from '../features/formatting/helpers';
import { GhostButton } from './ui/ghost-button';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_LIST = Array.from({ length: CURRENT_YEAR + 5 - 1989 }, (_, i) => CURRENT_YEAR + 5 - i);

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MODES: { key: PeriodMode; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'custom', label: 'Custom' },
  { key: 'all', label: 'All' },
];

const QUICK_MODES: { key: DynamicPeriodMode; label: string }[] = [
  { key: 'today', label: translate('common.today') },
  { key: 'this-week', label: translate('common.this-week') },
  { key: 'this-month', label: translate('common.this-month') },
  { key: 'this-year', label: translate('common.this-year') },
];

export type PeriodSelectorModalProps = {
  selection: PeriodSelection;
};

function defaultDraftFor(selection: PeriodSelection): PeriodSelection {
  return selection;
}

const MODE_BUTTONS = [...QUICK_MODES, ...MODES];

export function PeriodSelectorModal({
  ref,
  selection,
}: PeriodSelectorModalProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const modal = useModalSheet();

  const [draft, setDraft] = React.useState<PeriodSelection>(() => defaultDraftFor(selection));
  const scrollRef = React.useRef<React.ComponentRef<typeof BottomSheetScrollView>>(null);
  const scrollReadyRef = React.useRef(false);
  const selectedYRef = React.useRef<number | null>(null);

  React.useImperativeHandle(ref, () => modal.ref.current as BottomSheetModal);

  // Sync draft when modal opens
  const handlePresent = React.useCallback(() => {
    setDraft(defaultDraftFor(selection));
    modal.present();
  }, [selection, modal]);

  React.useImperativeHandle(ref, () => ({
    ...(modal.ref.current as BottomSheetModal),
    present: handlePresent,
    close: modal.close,
  } as BottomSheetModal));

  const handleApply = React.useCallback(() => {
    setPeriodSelection(draft);
    modal.close();
  }, [draft, modal]);

  const handleClear = React.useCallback(() => {
    setPeriodSelection({ mode: 'month', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    modal.close();
  }, [modal]);

  const switchMode = React.useCallback((mode: PeriodMode) => {
    const now = new Date();
    switch (mode) {
      case 'year':
        setDraft({ mode: 'year', year: draft.mode === 'year' ? draft.year : now.getFullYear() });
        break;
      case 'month':
        setDraft({
          mode: 'month',
          year: 'year' in draft ? (draft as any).year : now.getFullYear(),
          month: draft.mode === 'month' ? draft.month : now.getMonth() + 1,
        });
        break;
      case 'week': {
        const { year, week } = currentISOWeek();
        setDraft({ mode: 'week', year: 'year' in draft ? (draft as any).year : year, week });
        break;
      }
      case 'custom':
        setDraft({ mode: 'custom', startDate: todayISO(), endDate: todayISO() });
        break;
      case 'all':
        setDraft({ mode: 'all' });
        break;
      case 'today':
      case 'this-week':
      case 'this-month':
      case 'this-year':
        setDraft({ mode });
        break;
    }
  }, [draft]);

  const tryScrollToSelectedWeek = React.useCallback(() => {
    if (scrollReadyRef.current && selectedYRef.current !== null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, selectedYRef.current - 80), animated: false });
    }
  }, []);

  const weekYear = draft.mode === 'week' ? draft.year : null;
  const weekWeek = draft.mode === 'week' ? draft.week : null;

  React.useEffect(() => {
    if (draft.mode !== 'week') return;
    selectedYRef.current = null;
    scrollReadyRef.current = false;
  }, [draft.mode, weekYear, weekWeek]);

  return (
    <ModalSheet ref={modal.ref} title="Select Period" snapPoints={['75%']}>
      <View className="flex-1">
        <BottomSheetScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="px-4 pt-2 pb-6"
          onLayout={() => {
            scrollReadyRef.current = true;
            tryScrollToSelectedWeek();
          }}
        >
          <View className="mb-8 flex-row flex-wrap gap-2">
            {MODE_BUTTONS.map(({ key, label }) => (
              <View className="min-w-[30%] flex-1 grow" key={key}>
                <OutlineButton
                  className={`items-center px-1 ${draft.mode === key ? '' : 'border-border'}`}
                  textClassName={`text-sm ${draft.mode === key ? '' : 'text-muted-foreground'}`}
                  fullWidth
                  label={label}
                  onPress={() => switchMode(key)}
                />
              </View>
            ))}
          </View>

          {draft.mode === 'year' && <YearBody selectedYear={draft.year} onSelect={(year) => setDraft({ mode: 'year', year })} />}
          {draft.mode === 'month' && (
            <MonthBody
              year={draft.year}
              month={draft.month}
              onChangeYear={(year) => setDraft({ ...draft, year })}
              onChangeMonth={(month) => setDraft({ ...draft, month })}
            />
          )}
          {draft.mode === 'week' && (
            <WeekBody
              year={draft.year}
              week={draft.week}
              onChangeYear={(year) => {
                const weeksInYear = getWeeksInYear(year);
                const week = Math.min(draft.week, weeksInYear.length);
                setDraft({ mode: 'week', year, week });
              }}
              onChangeWeek={(week) => setDraft({ ...draft, week })}
              onSelectedLayoutY={(y) => {
                selectedYRef.current = y;
                tryScrollToSelectedWeek();
              }}
            />
          )}
          {draft.mode === 'custom' && (
            <CustomBody
              startDate={draft.startDate}
              endDate={draft.endDate}
              onChangeStart={(startDate) => setDraft({ ...draft, startDate })}
              onChangeEnd={(endDate) => setDraft({ ...draft, endDate })}
            />
          )}
          {draft.mode === 'all' && (
            <View className="items-center justify-center py-8">
              <Text className="text-muted-foreground">{translate('common.all-data-shown')}</Text>
            </View>
          )}
          {isDynamicPeriodMode(draft.mode) && (
            <View className="items-center justify-center py-8">
              <Text className="text-muted-foreground">{translate('common.always-current-period')}</Text>
            </View>
          )}
        </BottomSheetScrollView>

        <View className="flex-row items-center justify-center gap-2 p-4">
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

function YearBody({ selectedYear, onSelect }: { selectedYear: number; onSelect: (year: number) => void }) {
  return (
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
    <View>
      <YearNavRow year={year} onChangeYear={onChangeYear} />
      <View className="mt-3 flex-row flex-wrap justify-evenly gap-2">
        {MONTH_LABELS.map((label, i) => {
          const m = i + 1;
          const selected = m === month;
          return (
            <GhostButton
              key={m}
              onPress={() => onChangeMonth(m)}
              className={`w-[31%] ${selected ? 'bg-muted' : ''}`}
              textClassName={`${selected ? '' : 'font-normal text-muted-foreground'} uppercase`}
              label={label}
            />
          );
        })}
      </View>
    </View>
  );
}

function WeekBody({
  year,
  week,
  onChangeYear,
  onChangeWeek,
  onSelectedLayoutY,
}: {
  year: number;
  week: number;
  onChangeYear: (y: number) => void;
  onChangeWeek: (w: number) => void;
  onSelectedLayoutY: (y: number) => void;
}) {
  const weeks = React.useMemo(() => getWeeksInYear(year), [year]);

  return (
    <View>
      <YearNavRow year={year} onChangeYear={onChangeYear} />
      <View className="mt-2 gap-2">
        {weeks.map(({ week: w, start, end }) => {
          const selected = w === week;
          return (
            <View
              key={w}
              onLayout={selected
                ? (e) => {
                    onSelectedLayoutY(e.nativeEvent.layout.y);
                  }
                : undefined}
            >
              <GhostButton
                fullWidth
                onPress={() => onChangeWeek(w)}
                className={`w-full rounded-xl ${selected ? 'bg-muted' : ''}`}
                textClassName={selected ? '' : 'font-normal text-muted-foreground'}
                label={`${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function CustomBody({
  startDate,
  endDate,
  onChangeStart,
  onChangeEnd,
}: {
  startDate: string;
  endDate: string;
  onChangeStart: (d: string) => void;
  onChangeEnd: (d: string) => void;
}) {
  return (
    <View className="flex-row gap-x-2 gap-y-4 pt-2">
      <View className="flex-1">
        <DateInput label={translate('common.start_date')} value={startDate} onChange={onChangeStart} size="lg" />
      </View>
      <View className="flex-1">
        <DateInput label={translate('common.end_date')} value={endDate} onChange={onChangeEnd} size="lg" />
      </View>
    </View>
  );
}

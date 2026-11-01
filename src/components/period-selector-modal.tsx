import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { DynamicPeriodMode } from '@/lib/date/period-modes';
import type { PeriodMode, PeriodSelection } from '@/lib/store/store';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Chip, getPressedStyle, ModalSheet, SolidButton, Text, useModalSheet } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { ChevronLeft, ChevronRight } from '@/components/ui/icon';
import { cn } from '@/lib/cn';
import { currentISOWeek, currentPeriodSelection, getWeeksInYear, isDynamicPeriodMode } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';

import { setPeriodSelection } from '@/lib/store/store';
import { todayISO } from '../features/formatting/helpers';

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
  { key: 'year', label: translate('common.year') },
  { key: 'month', label: translate('common.month') },
  { key: 'week', label: translate('common.week') },
  { key: 'day', label: translate('common.day') },
  { key: 'custom', label: translate('common.custom_range') },
  { key: 'all', label: translate('common.all-time') },
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
    setPeriodSelection(currentPeriodSelection());
    modal.close();
  }, [modal]);

  const switchMode = React.useCallback((mode: PeriodMode) => {
    const now = currentPeriodSelection();
    switch (mode) {
      case 'year':
        setDraft({ mode: 'year', year: draft.mode === 'year' ? draft.year : now.year });
        break;
      case 'month':
        setDraft({
          mode: 'month',
          year: 'year' in draft ? draft.year : now.year,
          month: draft.mode === 'month' ? draft.month : now.month,
        });
        break;
      case 'week': {
        const { year, week } = currentISOWeek();
        setDraft({ mode: 'week', year: 'year' in draft ? draft.year : year, week });
        break;
      }
      case 'custom':
        setDraft({ mode: 'custom', startDate: todayISO(), endDate: todayISO() });
        break;
      case 'day':
        setDraft({ mode: 'day', date: draft.mode === 'day' ? draft.date : todayISO() });
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
    <ModalSheet ref={modal.ref} title={translate('common.period')} snapPoints={['78%']}>
      <View className="flex-1">
        <BottomSheetScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="px-5 pt-3 pb-6"
          onLayout={() => {
            scrollReadyRef.current = true;
            tryScrollToSelectedWeek();
          }}
        >
          <View className="mb-6 flex-row flex-wrap gap-2">
            {MODE_BUTTONS.map(({ key, label }) => (
              <Chip key={key} tone="solid" label={label} selected={draft.mode === key} onPress={() => switchMode(key)} className="px-3.5" />
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
          {draft.mode === 'day' && (
            <DayBody
              date={draft.date}
              onChangeDate={(date) => setDraft({ mode: 'day', date })}
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

        <View className="flex-row items-center gap-2.5 px-5 pt-3 pb-4">
          <SolidButton color="tonal" size="lg" label={translate('common.clear')} onPress={handleClear} />
          <SolidButton
            color="primary"
            size="lg"
            label={translate('common.apply')}
            className="flex-1"
            textClassName="font-semibold"
            onPress={handleApply}
          />
        </View>
      </View>
    </ModalSheet>
  );
}

function Tile({ label, selected, onPress, className }: { label: string; selected: boolean; onPress: () => void; className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={getPressedStyle}
      className={cn('h-14 items-center justify-center rounded-tile px-3', selected ? 'bg-primary' : 'bg-card-2', className)}
    >
      <Text numberOfLines={1} className={cn('text-base font-semibold', selected && 'text-primary-foreground')}>{label}</Text>
    </Pressable>
  );
}

function YearBody({ selectedYear, onSelect }: { selectedYear: number; onSelect: (year: number) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {YEAR_LIST.map((year) => (
        <Tile key={year} className="w-[31.5%]" label={year.toString()} selected={year === selectedYear} onPress={() => onSelect(year)} />
      ))}
    </View>
  );
}

function YearNavButton({ icon: Icon, onPress, label }: { icon: typeof ChevronLeft; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label} style={getPressedStyle} className="size-10 items-center justify-center rounded-full bg-card-2">
      <Icon size={20} colorClassName="accent-foreground" />
    </Pressable>
  );
}

function YearNavRow({ year, onChangeYear }: { year: number; onChangeYear: (y: number) => void }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <YearNavButton icon={ChevronLeft} label={String(year - 1)} onPress={() => onChangeYear(year - 1)} />
      <Text className="text-xl font-semibold">{year}</Text>
      <YearNavButton icon={ChevronRight} label={String(year + 1)} onPress={() => onChangeYear(year + 1)} />
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
      <View className="mt-3 flex-row flex-wrap gap-2">
        {MONTH_LABELS.map((label, i) => (
          <Tile key={label} className="w-[23.5%]" label={label} selected={i + 1 === month} onPress={() => onChangeMonth(i + 1)} />
        ))}
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
              <Tile
                onPress={() => onChangeWeek(w)}
                selected={selected}
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

function DayBody({ date, onChangeDate }: { date: string; onChangeDate: (d: string) => void }) {
  return (
    <View className="pt-2">
      <DateInput label={translate('common.day')} value={date} onChange={onChangeDate} size="lg" />
    </View>
  );
}

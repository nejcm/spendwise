import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { PeriodMode, PeriodSelection } from '@/lib/store';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { Modal, SolidButton, Text, useModal } from '@/components/ui';
import { DateInput } from '@/components/ui/date-input';
import { IconButton } from '@/components/ui/icon-button';
import { currentISOWeek, getWeeksInYear } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
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
];

export type PeriodSelectorModalProps = {
  selection: PeriodSelection;
  onSelect: (s: PeriodSelection) => void;
};

function defaultDraftFor(selection: PeriodSelection): PeriodSelection {
  return selection;
}

export function PeriodSelectorModal({
  ref,
  selection,
  onSelect,
}: PeriodSelectorModalProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const modal = useModal();

  const [draft, setDraft] = React.useState<PeriodSelection>(() => defaultDraftFor(selection));

  React.useImperativeHandle(ref, () => modal.ref.current as BottomSheetModal);

  // Sync draft when modal opens
  const handlePresent = React.useCallback(() => {
    setDraft(defaultDraftFor(selection));
    modal.present();
  }, [selection, modal]);

  React.useImperativeHandle(ref, () => ({
    ...(modal.ref.current as BottomSheetModal),
    present: handlePresent,
    dismiss: modal.dismiss,
  } as BottomSheetModal));

  const handleApply = React.useCallback(() => {
    onSelect(draft);
    modal.dismiss();
  }, [draft, onSelect, modal]);

  const handleClear = React.useCallback(() => {
    onSelect({ mode: 'month', year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
    modal.dismiss();
  }, [onSelect, modal]);

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
    }
  }, [draft]);

  return (
    <Modal ref={modal.ref} title="Select Period" snapPoints={['75%']}>
      <View className="flex-1 px-4 pt-2">
        <View className="mb-4 flex-row gap-2">
          {MODES.map(({ key, label }) => (
            <SolidButton
              key={key}
              className="flex-1 items-center rounded-3xl"
              color={draft.mode === key ? 'secondary' : 'primary-alt'}
              textClassName={draft.mode === key ? 'text-foreground' : 'text-muted-foreground'}
              size="sm"
              label={label}
              onPress={() => switchMode(key)}
            />
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
        </View>

        <View className="flex-row items-center justify-center gap-2 pt-4 pb-6">
          <GhostButton
            label={translate('common.clear')}
            onPress={handleClear}
          />
          <SolidButton label={translate('common.apply')} className="flex-1" onPress={handleApply} />
        </View>
      </View>
    </Modal>
  );
}

function YearBody({ selectedYear, onSelect }: { selectedYear: number; onSelect: (year: number) => void }) {
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

function YearNavRow({ year, onChangeYear }: { year: number; onChangeYear: (y: number) => void }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <IconButton size="sm" color="none" onPress={() => onChangeYear(year - 1)} hitSlop={12}>
        <ArrowLeftIcon className="text-muted-foreground size-5" />
      </IconButton>
      <Text className="text-base font-semibold">{year}</Text>
      <IconButton size="sm" color="none" onPress={() => onChangeYear(year + 1)} hitSlop={12}>
        <ArrowRightIcon className="text-muted-foreground size-5" />
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
    <BottomSheetScrollView>
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
    </BottomSheetScrollView>
  );
}

function WeekBody({
  year,
  week,
  onChangeYear,
  onChangeWeek,
}: {
  year: number;
  week: number;
  onChangeYear: (y: number) => void;
  onChangeWeek: (w: number) => void;
}) {
  const weeks = React.useMemo(() => getWeeksInYear(year), [year]);
  const scrollRef = React.useRef<React.ComponentRef<typeof BottomSheetScrollView>>(null);
  const selectedYRef = React.useRef<number | null>(null);
  const containerReadyRef = React.useRef(false);

  // Reset when year/week changes so we re-scroll
  React.useEffect(() => {
    selectedYRef.current = null;
    containerReadyRef.current = false;
  }, [year, week]);

  const tryScroll = React.useCallback(() => {
    if (containerReadyRef.current && selectedYRef.current !== null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, selectedYRef.current - 80), animated: false });
    }
  }, []);

  return (
    <View className="flex-1">
      <YearNavRow year={year} onChangeYear={onChangeYear} />
      <BottomSheetScrollView
        ref={scrollRef}
        className="mt-2"
        onLayout={() => {
          containerReadyRef.current = true;
          tryScroll();
        }}
      >
        {weeks.map(({ week: w, start, end }) => {
          const selected = w === week;
          return (
            <View
              key={w}
              onLayout={selected
                ? (e) => {
                    selectedYRef.current = e.nativeEvent.layout.y;
                    tryScroll();
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
      </BottomSheetScrollView>
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

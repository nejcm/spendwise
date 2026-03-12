import { addMonths, format, subMonths } from 'date-fns';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Picker } from 'react-native-wheel-pick';

import { Modal, Text, useModal } from '@/components/ui';
import { formatMonthYear } from '@/features/formatting/helpers';

const MONTHS_RANGE = 24; // 24 months back + 24 forward

function getMonthOptions(centerDate: Date): { value: string; label: string }[] {
  const start = subMonths(centerDate, MONTHS_RANGE);
  const options: { value: string; label: string }[] = [];
  for (let i = 0; i <= MONTHS_RANGE * 2; i++) {
    const d = addMonths(start, i);
    const value = format(d, 'yyyy-MM');
    options.push({ value, label: formatMonthYear(`${value}-01`) });
  }
  return options;
}

export type MonthPickerRef = { present: () => void; dismiss: () => void };

type Props = {
  selectedMonth: string; // yyyy-MM
  onSelect: (month: string) => void;
};

export function MonthPicker({ ref, selectedMonth, onSelect }: Props & { ref?: React.RefObject<MonthPickerRef | null> }) {
  const modal = useModal();
  const [pendingMonth, setPendingMonth] = React.useState(selectedMonth);

  React.useImperativeHandle(ref, () => ({ present: modal.present, dismiss: modal.dismiss }), [modal.present, modal.dismiss]);

  // Sync pending selection when selectedMonth changes (e.g. when reopening with a different month)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- intentional: sync prop to local state
    setPendingMonth(selectedMonth);
  }, [selectedMonth]);

  const centerDate = React.useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m - 1, 1);
  }, [selectedMonth]);
  const pickerData = React.useMemo(() => getMonthOptions(centerDate), [centerDate]);

  const handleDone = React.useCallback(() => {
    onSelect(pendingMonth);
    modal.dismiss();
  }, [pendingMonth, onSelect, modal]);

  return (
    <Modal ref={modal.ref} title="Select month" snapPoints={['45%']}>
      <View className="items-center px-4 pb-6">
        <Picker
          style={{
            backgroundColor: 'transparent',
            width: '100%',
            height: 200,
          }}
          selectedValue={pendingMonth}
          pickerData={pickerData}
          onValueChange={(value: string) => setPendingMonth(value)}
          isShowSelectBackground={true}
          isShowSelectLine={true}
        />
        <Pressable
          onPress={handleDone}
          className="mt-2 w-full items-center rounded-lg bg-primary-500 py-3 active:opacity-80"
        >
          <Text className="font-medium text-white">Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

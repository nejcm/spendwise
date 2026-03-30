import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { TxKeyPath } from '@/lib/i18n';

import { Picker } from '@react-native-picker/picker';
import * as React from 'react';
import { ModalSheet, useModalSheet, View } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useThemeConfig } from '@/lib/theme/use-theme-config';

// ? TODO: use Options instead of Picker

export type MonthPickerProps = {
  selectedMonth: number; // 1-12
  onSelect: (month: number) => void;
};

export type YearPickerProps = {
  selectedYear: number; // yyyy
  onSelect: (year: number) => void;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => translate(`date.months.m${i + 1}` as TxKeyPath));
const CURRENT_YEAR = new Date().getFullYear();
const FROM_YEAR = 1990;
const YEARS = Array.from({ length: CURRENT_YEAR + 10 - FROM_YEAR + 1 }, (_, i) => FROM_YEAR + i);

export function MonthPicker({ ref, selectedMonth, onSelect }: MonthPickerProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const modal = useModalSheet();
  const { colors } = useThemeConfig();

  React.useImperativeHandle(ref, () => modal.ref.current as BottomSheetModal);

  return (
    <ModalSheet ref={modal.ref} title={translate('common.select_month')} snapPoints={['45%']}>
      <View className="p-4">
        <Picker
          selectedValue={selectedMonth}
          onValueChange={(val) => {
            onSelect(val);
            modal.dismiss();
          }}
          style={{
            color: colors.text,
            backgroundColor: colors.background,
          }}
        >
          {MONTHS.map((label, i) => (
            <Picker.Item key={i} label={label} value={i + 1} />
          ))}
        </Picker>
      </View>
    </ModalSheet>
  );
}

export function YearPicker({ ref, selectedYear, onSelect }: YearPickerProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  const modal = useModalSheet();
  const { colors } = useThemeConfig();

  React.useImperativeHandle(ref, () => modal.ref.current as BottomSheetModal);

  return (
    <ModalSheet ref={modal.ref} title={translate('common.select_year')} snapPoints={['45%']}>
      <View className="p-4">
        <Picker
          selectedValue={selectedYear}
          onValueChange={(val) => {
            onSelect(val);
            modal.dismiss();
          }}
          style={{
            color: colors.text,
            backgroundColor: colors.background,
          }}
        >
          {YEARS.map((y) => (
            <Picker.Item key={y} label={String(y)} value={y} />
          ))}
        </Picker>
      </View>
    </ModalSheet>
  );
}

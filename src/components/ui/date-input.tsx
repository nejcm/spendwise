import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { InputProps } from '@/components/ui/input';
import type { ModalSheetProps } from '@/components/ui/modal-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import * as React from 'react';

import { Platform, Pressable, View } from 'react-native';
import { Input } from '@/components/ui/input';
import { ModalSheet, useModalSheet } from '@/components/ui/modal-sheet';
import { todayISO } from '@/features/formatting/helpers';
import { IS_WEB } from '@/lib/base';
import { tryFormatDate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';

export type DateInputProps = {
  value: string;
  onChange: (date: string) => void;
  modalProps?: Partial<ModalSheetProps>;
} & Omit<InputProps, 'value' | 'onChange'>;

export function DateInput({ label, value, onChange, error, modalProps, ...rest }: DateInputProps) {
  const { ref, present, dismiss } = useModalSheet();
  const dateFormat = useAppStore.use.dateFormat();

  const dateValue = React.useMemo(() => parseISO(value || todayISO()), [value]);

  const handleChange = React.useCallback(
    (_event: DateTimePickerEvent, selectedDate?: Date) => {
      if (selectedDate) onChange(format(selectedDate, 'yyyy-MM-dd'));
      dismiss();
    },
    [onChange, dismiss],
  );

  if (IS_WEB) {
    return (
      <Input
        label={label}
        value={value ? tryFormatDate(value, dateFormat) || value : ''}
        placeholder={translate('common.select_date')}
        textContentType="dateTime"
        error={error}
        onChangeText={(v) => {
          const formatted = tryFormatDate(v, dateFormat) || v;
          onChange(formatted);
        }}
        {...rest}
      />
    );
  }
  return (
    <>
      <Pressable onPress={present}>
        <Input
          label={label}
          value={value ? format(parseISO(value), dateFormat) : ''}
          placeholder={translate('common.select_date')}
          error={error}
          editable={false}
          pointerEvents="none"
          {...rest}
        />
      </Pressable>
      <ModalSheet ref={ref} snapPoints={Platform.OS === 'android' ? ['1%'] : ['45%']} {...modalProps}>
        <View className="items-center px-4 pb-6">
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="spinner"
            onChange={handleChange}
          />
        </View>
      </ModalSheet>
    </>
  );
}

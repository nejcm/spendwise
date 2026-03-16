import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { InputProps } from '@/components/ui/input';
import type { ModalProps } from '@/components/ui/modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import * as React from 'react';

import { Pressable, View } from 'react-native';
import { Input } from '@/components/ui/input';
import { Modal, useModal } from '@/components/ui/modal';
import { formatDate, todayISO } from '@/features/formatting/helpers';
import { IS_WEB } from '@/lib/base';
import { translate } from '@/lib/i18n';
import { tryFormatDate } from '../../lib/date/helpers';

export type DateInputProps = {
  value: string;
  onChange: (date: string) => void;
  modalProps?: Partial<ModalProps>;
  displayFormat?: string;
} & Omit<InputProps, 'value' | 'onChange'>;

export function DateInput({ label, value, onChange, error, modalProps, displayFormat, ...rest }: DateInputProps) {
  const { ref, present, dismiss } = useModal();

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
        value={value ? tryFormatDate(value, displayFormat) || value : ''}
        placeholder={translate('common.select_date')}
        textContentType="dateTime"
        error={error}
        onChangeText={(v) => {
          const formatted = tryFormatDate(v, displayFormat) || v;
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
          value={value ? formatDate(value, displayFormat) : 'Nope'}
          placeholder={translate('common.select_date')}
          error={error}
          editable={false}
          pointerEvents="none"
          {...rest}
        />
      </Pressable>
      <Modal ref={ref} snapPoints={['45%']} {...modalProps}>
        <View className="items-center px-4 pb-6">
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="spinner"
            onChange={handleChange}
          />
        </View>
      </Modal>
    </>
  );
}

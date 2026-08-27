import type { InputProps } from '@/components/ui/input';
import type { ModalSheetProps } from '@/components/ui/modal-sheet';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import * as React from 'react';

import { Keyboard, Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { Input } from '@/components/ui/input';
import { ModalSheet, useModalSheet } from '@/components/ui/modal-sheet';
import { todayISO } from '@/features/formatting/helpers';
import { IS_WEB } from '@/lib/base';
import { commitPickerDate, tryFormatDate } from '@/lib/date/helpers';
import { getLanguage, translate } from '@/lib/i18n';
import { useAppStore } from '@/lib/store/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';

export type DateInputProps = {
  value: string;
  onChange: (date: string) => void;
  modalProps?: Partial<ModalSheetProps>;
} & Omit<InputProps, 'value' | 'onChange'>;

export function DateInput({ label, value, onChange, error, modalProps, ...rest }: DateInputProps) {
  const { ref, present, close } = useModalSheet();
  const dateFormat = useAppStore.use.dateFormat();
  const theme = useThemeConfig();
  const { width } = useWindowDimensions();

  const dateValue = React.useMemo(() => parseISO(value || todayISO()), [value]);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const commit = React.useCallback((event: { type: string }, selectedDate?: Date) => {
    const next = commitPickerDate(event, selectedDate);
    if (next) onChangeRef.current(next);
  }, []);

  const handleIosValueChange = React.useCallback(
    (_event: unknown, selectedDate: Date) => {
      commit({ type: 'set' }, selectedDate);
      close();
    },
    [commit, close],
  );

  const open = React.useCallback(() => {
    Keyboard.dismiss();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: 'date',
        onValueChange: (_event, selectedDate) => {
          commit({ type: 'set' }, selectedDate);
        },
        positiveButton: { label: translate('common.ok') },
        negativeButton: { label: translate('common.cancel') },
        title: translate('common.select_date'),
      });
      return;
    }
    present();
  }, [commit, dateValue, present]);

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
      <Pressable onPress={open}>
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
      {Platform.OS === 'ios' && (
        <ModalSheet ref={ref} snapPoints={['60%']} stackBehavior="push" {...modalProps}>
          <View className="items-center px-4 pb-6">
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="inline"
              locale={getLanguage()}
              themeVariant={theme.dark ? 'dark' : 'light'}
              onValueChange={handleIosValueChange}
              style={{ width: width - 32, height: 360 }}
            />
          </View>
        </ModalSheet>
      )}
    </>
  );
}

import type { CurrencyFormat, DateFormat, NumberFormat } from '../formatting/constants';

import type { OptionType } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import { Calendar, CircleDollarSign, DecimalsArrowRight, Euro } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import { FocusAwareStatusBar, Options, ScrollView, useModal } from '@/components/ui';
import { CURRENCY_OPTIONS } from '@/features/currencies';
import { translate } from '@/lib/i18n';
import { setCurrency, setCurrencyFormat, setDateFormat, setMonthStartDay, setNumberFormat, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { CURRENCY_FORMAT_OPTIONS, DATE_FORMAT_OPTIONS, NUMBER_FORMAT_OPTIONS } from '../formatting/constants';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';

const iconColor = 'gray-foreground';
const baseNs = 'settings.formattingOptions' as const;

type ModalType = 'currency' | 'currencyFormat' | 'dateFormat' | 'numberFormat' | 'monthStartDay';
const OptionsProps: Record<ModalType, {
  options: OptionType[];
  onSelect: (value: OptionType) => void;
}> = {
  currency: {
    options: CURRENCY_OPTIONS,
    onSelect: (option: OptionType) => {
      setCurrency(option.value as CurrencyKey);
    },
  },
  currencyFormat: {
    options: CURRENCY_FORMAT_OPTIONS.map((opt) => ({
      label: translate(`${baseNs}.currencyFormat.${opt}`),
      value: opt,
    })),
    onSelect: (option: OptionType) => {
      setCurrencyFormat(option.value as CurrencyFormat);
    },
  },
  dateFormat: {
    options: DATE_FORMAT_OPTIONS.map((opt) => ({
      label: translate(`${baseNs}.dateFormat.${opt}`),
      value: opt,
    })) as OptionType[],
    onSelect: (option: OptionType) => {
      setDateFormat(option.value as DateFormat);
    },
  },
  numberFormat: {
    options: NUMBER_FORMAT_OPTIONS.map((opt) => ({
      label: translate(`${baseNs}.numberFormat.${opt}`),
      value: opt,
    })) as OptionType[],
    onSelect: (option: OptionType) => {
      setNumberFormat(option.value as NumberFormat);
    },
  },
  monthStartDay: {
    options: Array.from({ length: 28 }, (_, i) => ({
      label: String(i + 1),
      value: String(i + 1),
    })) as OptionType[],
    onSelect: (option: OptionType) => {
      const trimmed = option.value ? String(option.value).trim() : undefined;
      if (!trimmed) return;
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isNaN(parsed)) return;
      if (parsed < 1 || parsed > 28) return;
      setMonthStartDay(parsed);
    },
  },
};

export function FormattingSettingsScreen() {
  const currency = useAppStore.use.currency();
  const currencyFormat = useAppStore.use.currencyFormat();
  const dateFormat = useAppStore.use.dateFormat();
  const numberFormat = useAppStore.use.numberFormat();
  // const monthStartDay = useAppStore.use.monthStartDay();
  const modal = useModal();
  const { dismiss } = modal;
  const [modalType, setModalType] = React.useState<ModalType | undefined>();

  const openModal = React.useCallback((type: ModalType) => {
    setModalType(type);
    modal.present();
  }, [modal]);

  const modalOptions = React.useMemo(() => {
    const opts = modalType ? OptionsProps[modalType] : { options: [], onSelect: () => {} };
    return {
      ...opts,
      onSelect: (option: OptionType) => {
        opts.onSelect(option);
        dismiss();
      },
    };
  }, [modalType, dismiss]);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-8" style={defaultStyles.transparentBg}>
        <SettingsContainer className="mb-2">
          <SettingsItem
            icon={<CircleDollarSign className={iconColor} size={20} />}
            text="settings.default_currency"
            value={currency}
            onPress={() => openModal('currency')}
          />
        </SettingsContainer>
        <SettingsContainer className="mb-2">
          <SettingsItem
            icon={<Euro className={iconColor} size={20} />}
            text="settings.currency_format"
            value={translate(`${baseNs}.currencyFormat.${currencyFormat}`)}
            onPress={() => openModal('currencyFormat')}
          />
        </SettingsContainer>
        <SettingsContainer className="mb-2">
          <SettingsItem
            icon={<DecimalsArrowRight className={iconColor} size={20} />}
            text="settings.number_format"
            value={translate(`${baseNs}.numberFormat.${numberFormat}`)}
            onPress={() => openModal('numberFormat')}
          />
        </SettingsContainer>
        <SettingsContainer className="mb-2">
          <SettingsItem
            icon={<Calendar className={iconColor} size={20} />}
            text="settings.date_format"
            value={translate(`${baseNs}.dateFormat.${dateFormat}`)}
            onPress={() => openModal('dateFormat')}
          />
        </SettingsContainer>
        {/* <SettingsContainer>
          <SettingsItem
            icon={<Calendar1 className={iconColor} size={20} />}
            text="settings.month_start"
            value={String(monthStartDay)}
            onPress={() => openModal('monthStartDay')}
          />
        </SettingsContainer> */}

        <Options
          ref={modal.ref}
          {...modalOptions}
        />
      </ScrollView>
    </View>
  );
}

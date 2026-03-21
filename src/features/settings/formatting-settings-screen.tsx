import type { CurrencyFormat, DateFormat, NumberFormat } from '../formatting/constants';

import type { OptionType } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { FocusAwareStatusBar, Options, SafeAreaView, ScrollView, useModal } from '@/components/ui';
import { Calendar, CircleDollarSign, DecimalsArrowRight, Euro } from '@/components/ui/icon';
import { CURRENCY_OPTIONS } from '@/features/currencies';
import { useChangeCurrency } from '@/features/currencies/hooks';
import { translate } from '@/lib/i18n';
import { setCurrencyFormat, setDateFormat, setMonthStartDay, setNumberFormat, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';
import { CURRENCY_FORMAT_OPTIONS, DATE_FORMAT_OPTIONS, NUMBER_FORMAT_OPTIONS } from '../formatting/constants';
import { SettingsContainer } from './components/settings-container';
import { SettingsItem } from './components/settings-item';

const iconColor = 'gray-foreground';
const baseNs = 'settings.formattingOptions' as const;

type ModalType = 'currency' | 'currencyFormat' | 'dateFormat' | 'numberFormat' | 'monthStartDay';

export function FormattingSettingsScreen() {
  const currency = useAppStore.use.currency();
  const currencyFormat = useAppStore.use.currencyFormat();
  const dateFormat = useAppStore.use.dateFormat();
  const numberFormat = useAppStore.use.numberFormat();
  const modal = useModal();
  const { dismiss } = modal;
  const [modalType, setModalType] = React.useState<ModalType | undefined>();
  const changeCurrency = useChangeCurrency();

  const handleCurrencySelect = React.useCallback((option: OptionType) => {
    const newCurrency = option.value as CurrencyKey;
    if (newCurrency === currency) {
      dismiss();
      return;
    }

    dismiss();
    Alert.alert(
      translate('settings.changeCurrencyTitle'),
      translate('settings.changeCurrencyWarning'),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.confirm'),
          onPress: () => {
            changeCurrency.mutate(newCurrency);
          },
        },
      ],
    );
  }, [currency, dismiss, changeCurrency]);

  const OptionsProps: Record<ModalType, {
    options: OptionType[];
    onSelect: (value: OptionType) => void;
  }> = React.useMemo(() => ({
    currency: {
      options: CURRENCY_OPTIONS,
      onSelect: handleCurrencySelect,
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
  }), [handleCurrencySelect]);

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
        // Currency modal dismisses itself after confirming — don't double-dismiss
        if (modalType !== 'currency') dismiss();
      },
    };
  }, [modalType, OptionsProps, dismiss]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FocusAwareStatusBar />
      {changeCurrency.isPending && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-background/80">
          <ActivityIndicator size="large" />
        </View>
      )}
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
    </SafeAreaView>
  );
}

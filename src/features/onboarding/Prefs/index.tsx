import type { OptionType } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import type { Language } from '@/features/languages/types';
import * as React from 'react';

import { Card, FlagCircle, ListRow, Options, SolidButton, Switch, Text, useModalSheet, View } from '@/components/ui';
import { CURRENCIES_MAP } from '@/features/currencies';
import { CurrencySheet } from '@/features/currencies/components/currency-sheet';
import { useChangeCurrency } from '@/features/currencies/hooks';
import { formatCurrency } from '@/features/formatting/helpers';
import { LANGUAGES_OPTIONS } from '@/features/languages';
import { canNotify, setupNotifications } from '@/features/notifications/notifications';
import { ThemePicker } from '@/features/settings/components/theme-picker';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { updateNotifications, useAppStore } from '@/lib/store/store';
import OnboardingLayout from '../layout';

export type PrefsStepProps = {
  onBack: () => void;
  onNext: () => void;
  onBeforeLanguageReload: () => void;
};

function SettingLabel({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View>
      <Text className="text-meta text-muted-foreground">{label}</Text>
      <View className="flex-row items-center gap-2">{value}</View>
    </View>
  );
}

export default function PrefsStep({ onBack, onNext, onBeforeLanguageReload }: PrefsStepProps) {
  const { selected: language, setLanguage } = useSelectedLanguage();
  const savedCurrency = useAppStore.use.currency();
  const numberFormat = useAppStore.use.numberFormat();
  const currencyFormat = useAppStore.use.currencyFormat();
  const [currency, setCurrency] = React.useState<CurrencyKey>(savedCurrency);
  const [reminders, setReminders] = React.useState(() => useAppStore.getState().notifications.global ?? true);
  const [saving, setSaving] = React.useState(false);
  const changeCurrency = useChangeCurrency();
  const languageModal = useModalSheet();
  const currencyModal = useModalSheet();
  const sample = formatCurrency(123456, currency, { numberFormat, currencyFormat });
  const [beforeSample, afterSample] = translate('onboarding.amount_preview', { amount: sample }).split(sample);

  const onSelectLanguage = (option: OptionType) => {
    languageModal.close();
    if (option.value === language.value) return;
    onBeforeLanguageReload();
    setLanguage(option.value as Language);
  };

  const onContinue = async () => {
    setSaving(true);
    try {
      if (currency !== savedCurrency) await changeCurrency.mutateAsync(currency);
    }
    catch {
      setSaving(false);
      return;
    }

    let global = false;
    if (reminders) {
      try {
        await setupNotifications();
        global = await canNotify();
      }
      catch {}
    }
    updateNotifications({ global });
    setSaving(false);
    onNext();
  };

  return (
    <OnboardingLayout
      step={2}
      title={translate('onboarding.prefs_title')}
      subtitle={translate('onboarding.prefs_subtitle')}
      onBack={onBack}
      footer={<SolidButton color="primary" size="lg" fullWidth label={translate('onboarding.continue')} loading={saving} onPress={onContinue} />}
    >
      <Card className="mt-7 px-4.5">
        <ListRow
          className="min-h-15 border-b border-border"
          chevron
          onPress={languageModal.present}
          title={<SettingLabel label={translate('settings.language')} value={<Text className="text-base font-medium">{language.name}</Text>} />}
        />
        <ListRow
          className="min-h-15"
          chevron
          onPress={currencyModal.present}
          title={(
            <SettingLabel
              label={translate('onboarding.main_currency')}
              value={(
                <>
                  <FlagCircle currency={currency} />
                  <Text className="text-base font-medium">{`${currency} · ${CURRENCIES_MAP[currency].name}`}</Text>
                </>
              )}
            />
          )}
        />
      </Card>
      <Text className="px-1 pt-2.5 text-meta text-muted-foreground">
        {beforeSample}
        <Text className="text-meta font-medium text-foreground tabular-nums">{sample}</Text>
        {afterSample}
      </Text>

      <Text accessibilityRole="header" className="pt-7 pb-3 text-[15px] font-semibold">{translate('settings.theme.title')}</Text>
      <ThemePicker />

      <Card className="mt-6 flex-row items-center gap-4 px-4.5 py-3.5">
        <View className="flex-1">
          <Text className="text-base font-medium">{translate('onboarding.reminders')}</Text>
          <Text className="text-meta text-muted-foreground">{translate('onboarding.reminders_hint')}</Text>
        </View>
        <Switch checked={reminders} onChange={setReminders} accessibilityLabel={translate('onboarding.reminders')} />
      </Card>

      <Options ref={languageModal.ref} options={LANGUAGES_OPTIONS} onSelect={onSelectLanguage} value={language.value} />
      <CurrencySheet ref={currencyModal.ref} value={currency} onSelect={setCurrency} />
    </OnboardingLayout>
  );
}

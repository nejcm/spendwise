import type { OptionType } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import type { Language } from '@/features/languages/types';
import type { ThemeType } from '@/features/settings/theme';
import * as React from 'react';

import { Card, FlagCircle, ListRow, Options, Pressable, SolidButton, Switch, Text, useModalSheet, View } from '@/components/ui';
import { CURRENCIES_MAP } from '@/features/currencies';
import { useChangeCurrency } from '@/features/currencies/hooks';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { formatCurrency } from '@/features/formatting/helpers';
import { LANGUAGES_OPTIONS } from '@/features/languages';
import { canNotify, setupNotifications } from '@/features/notifications/notifications';
import { cn } from '@/lib/cn';
import { translate, useSelectedLanguage } from '@/lib/i18n';
import { updateNotifications, useAppStore } from '@/lib/store/store';
import { useSelectedTheme } from '@/lib/theme/use-selected-theme';
import OnboardingLayout from '../layout';

const THEME_PREVIEWS: { value: ThemeType; swatch: string; card: string; bar: string }[] = [
  { value: 'light', swatch: '#efeafc', card: '#ffffff', bar: '#6b4fd8' },
  { value: 'dark', swatch: '#111214', card: '#2a2b30', bar: '#d4f05a' },
  { value: 'system', swatch: '#efeafc', card: '#c9c4d6', bar: '#8f7fd0' },
];

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

function ThemePreview({ swatch, card, bar, split }: { swatch: string; card: string; bar: string; split: boolean }) {
  return (
    <View className="h-[72px] overflow-hidden rounded-[10px]" style={{ backgroundColor: swatch }}>
      {split && <View className="absolute inset-y-0 right-0 w-1/2 bg-[#111214]" />}
      <View className="absolute inset-x-2 top-2.5 h-4 rounded-[5px]" style={{ backgroundColor: card }} />
      <View className="absolute top-[34px] left-2 h-2 w-[34px] rounded-sm" style={{ backgroundColor: bar }} />
      <View className="absolute top-12 left-2 h-2 w-[52px] rounded-sm" style={{ backgroundColor: card }} />
    </View>
  );
}

export default function PrefsStep({ onBack, onNext, onBeforeLanguageReload }: PrefsStepProps) {
  const { selected: language, setLanguage } = useSelectedLanguage();
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
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

  const onSelectCurrency = (option: OptionType) => {
    currencyModal.close();
    setCurrency(option.value as CurrencyKey);
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
      <Card className="mt-7 px-[18px]">
        <ListRow
          className="min-h-[60px] border-b border-border"
          chevron
          onPress={languageModal.present}
          title={<SettingLabel label={translate('settings.language')} value={<Text className="text-base font-medium">{language.name}</Text>} />}
        />
        <ListRow
          className="min-h-[60px]"
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
      <View accessibilityRole="radiogroup" accessibilityLabel={translate('settings.theme.title')} className="flex-row gap-2.5">
        {THEME_PREVIEWS.map(({ value, ...preview }) => {
          const checked = value === selectedTheme;
          return (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              onPress={() => setSelectedTheme(value)}
              className={cn('flex-1 gap-2.5 rounded-[18px] border-2 bg-card p-2.5', checked ? 'border-foreground' : 'border-transparent')}
            >
              <ThemePreview {...preview} split={value === 'system'} />
              <Text className="text-sm font-medium">{translate(`settings.theme.${value}`)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card className="mt-6 flex-row items-center gap-4 px-[18px] py-3.5">
        <View className="flex-1">
          <Text className="text-base font-medium">{translate('onboarding.reminders')}</Text>
          <Text className="text-meta text-muted-foreground">{translate('onboarding.reminders_hint')}</Text>
        </View>
        <Switch checked={reminders} onChange={setReminders} accessibilityLabel={translate('onboarding.reminders')} />
      </Card>

      <Options ref={languageModal.ref} options={LANGUAGES_OPTIONS} onSelect={onSelectLanguage} value={language.value} />
      <Options ref={currencyModal.ref} options={CURRENCY_OPTIONS} onSelect={onSelectCurrency} value={currency} searchEnabled />
    </OnboardingLayout>
  );
}

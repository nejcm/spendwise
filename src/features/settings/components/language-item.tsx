import type { Language } from '../../languages';

import type { OptionType } from '@/components/ui';
import * as React from 'react';
import { Options, useModal } from '@/components/ui';

import { useSelectedLanguage } from '@/lib/i18n';
import { LANGUAGES } from '../../languages';
import { SettingsItem } from './settings-item';

const LANGUAGES_OPTIONS = LANGUAGES.map((lang) => ({ ...lang, label: lang.name, value: lang.value }));

export function LanguageItem() {
  const { language, setLanguage } = useSelectedLanguage();
  const modal = useModal();
  const onSelect = React.useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal],
  );

  const selectedLanguage = React.useMemo(() => LANGUAGES_OPTIONS.find((lang) => lang.value === language), [language]);

  return (
    <>
      <SettingsItem text="settings.language" value={selectedLanguage?.label} onPress={modal.present} />
      <Options ref={modal.ref} options={LANGUAGES_OPTIONS} onSelect={onSelect} value={selectedLanguage?.value} />
    </>
  );
}

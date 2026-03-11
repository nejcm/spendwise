import type { Language } from '../../languages/types';

import type { OptionType } from '@/components/ui';
import { Languages } from 'lucide-react-native';
import * as React from 'react';

import { Options, useModal } from '@/components/ui';
import { useSelectedLanguage } from '@/lib/i18n';
import { LANGUAGES_OPTIONS } from '../../languages';
import { SettingsItem } from './settings-item';

export function LanguageItem() {
  const modal = useModal();
  const { selected, setLanguage } = useSelectedLanguage();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setLanguage(option.value as Language);
      modal.dismiss();
    },
    [setLanguage, modal],
  );

  return (
    <>
      <SettingsItem text="settings.language" icon={<Languages className="text-foreground" size={20} />} value={selected?.name} onPress={modal.present} />
      <Options ref={modal.ref} options={LANGUAGES_OPTIONS} onSelect={onSelect} value={selected?.value} />
    </>
  );
}

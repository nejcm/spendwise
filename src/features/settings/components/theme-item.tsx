import type { ThemeType } from '../theme';

import type { OptionType } from '@/components/ui';
import { Sun } from 'lucide-react-native';
import * as React from 'react';

import { Options, useModal } from '@/components/ui';
import { useSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { THEMES_OPTIONS } from '../theme';
import { SettingsItem } from './settings-item';

export function ThemeItem() {
  const { selectedTheme, setSelectedTheme } = useSelectedTheme();
  const modal = useModal();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setSelectedTheme(option.value as ThemeType);
      modal.dismiss();
    },
    [setSelectedTheme, modal],
  );

  const theme = React.useMemo(() => THEMES_OPTIONS.find((t) => t.value === selectedTheme), [selectedTheme]);

  return (
    <>
      <SettingsItem text="settings.theme.title" icon={<Sun className="text-foreground" size={20} />} value={theme?.label} onPress={modal.present} />
      <Options ref={modal.ref} options={THEMES_OPTIONS} onSelect={onSelect} value={theme?.value} />
    </>
  );
}

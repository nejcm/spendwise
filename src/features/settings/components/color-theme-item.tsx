import type { OptionType } from '@/components/ui';
import type { ColorThemeType } from '@/lib/store/store';
import * as React from 'react';
import { Options, Paintbrush, useModalSheet } from '@/components/ui';
import { COLOR_THEME_OPTIONS } from '@/lib/theme/color-theme';
import { useSelectedColorTheme } from '@/lib/theme/use-selected-color-theme';
import { SettingsItem } from './settings-item';

export function ColorThemeItem() {
  const { selectedColorTheme, setSelectedColorTheme } = useSelectedColorTheme();
  const modal = useModalSheet();

  const onSelect = React.useCallback(
    (option: OptionType<ColorThemeType>) => {
      setSelectedColorTheme(option.value);
      modal.dismiss();
    },
    [setSelectedColorTheme, modal],
  );

  const colorTheme = React.useMemo(
    () => COLOR_THEME_OPTIONS.find((theme) => theme.value === selectedColorTheme),
    [selectedColorTheme],
  );

  return (
    <>
      <SettingsItem
        text="settings.color_theme.title"
        icon={<Paintbrush colorClassName="accent-foreground" size={20} />}
        value={colorTheme?.label}
        onPress={modal.present}
      />
      <Options ref={modal.ref} options={COLOR_THEME_OPTIONS} onSelect={onSelect} value={selectedColorTheme} />
    </>
  );
}

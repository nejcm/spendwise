import type { OptionType } from '@/components/ui';
import type { AccentType } from '@/lib/theme/accent';
import * as React from 'react';
import { Options, Paintbrush, useModalSheet } from '@/components/ui';
import { ACCENT_OPTIONS } from '@/lib/theme/accent';
import { useSelectedAccent } from '@/lib/theme/use-selected-accent';
import { SettingsItem } from './settings-item';

export function AccentItem() {
  const { selected, setSelected } = useSelectedAccent();
  const modal = useModalSheet();

  const onSelect = React.useCallback(
    (option: OptionType<AccentType>) => {
      setSelected(option.value);
      modal.close();
    },
    [setSelected, modal],
  );

  const accentColor = React.useMemo(
    () => ACCENT_OPTIONS.find((theme) => theme.value === selected),
    [selected],
  );

  return (
    <>
      <SettingsItem
        text="settings.accent.title"
        icon={<Paintbrush colorClassName="accent-foreground" size={20} />}
        value={accentColor?.label}
        onPress={modal.present}
      />
      <Options ref={modal.ref} options={ACCENT_OPTIONS} onSelect={onSelect} value={selected} />
    </>
  );
}

import type { OptionType } from '@/components/ui';
import type { CurrencyKey } from '@/features/currencies';
import * as React from 'react';
import { Euro, Options, useModal } from '@/components/ui';
import { CURRENCY_OPTIONS } from '@/features/currencies/images';
import { setCurrency, useAppStore } from '@/lib/store';
import { SettingsItem } from './settings-item';

export function CurrencyItem() {
  const modal = useModal();
  const currency = useAppStore.use.currency();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setCurrency(option.value as CurrencyKey);
      modal.dismiss();
    },
    [modal],
  );

  return (
    <>
      <SettingsItem text="common.currency" icon={<Euro className="text-foreground" size={20} />} value={currency} onPress={modal.present} />
      <Options ref={modal.ref} options={CURRENCY_OPTIONS} onSelect={onSelect} value={currency} />
    </>
  );
}

import type { IconButtonProps } from '@/components/ui';
import * as React from 'react';
import { getPressedStyle, IconButton } from '@/components/ui';
import { ScanLine } from '@/components/ui/icon';
import { translate } from '@/lib/i18n';
import { closeSheet, triggerScanPicker } from '@/lib/store/local-store';

export type ScanFabProps = Partial<IconButtonProps>;

export function ScanFab(props: ScanFabProps) {
  return (
    <IconButton
      onPress={() => {
        closeSheet();
        triggerScanPicker();
      }}
      hitSlop={8}
      size="sm"
      color="secondary"
      style={getPressedStyle}
      accessibilityLabel={translate('scan.button_label')}
      {...props}
    >
      <ScanLine className="text-foreground" size={16} />
    </IconButton>
  );
}

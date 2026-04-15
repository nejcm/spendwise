import type { LongPressActionType } from '@/lib/store/store';
import * as React from 'react';
import DetailsSection from '@/components/details';
import { FocusAwareStatusBar, ScrollView, Select, Switch } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { updateAppState, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';

const LONG_PRESS_ACTION_OPTIONS: LongPressActionType[] = ['scan_receipt', 'pick_from_gallery'];

export function GeneralSettingsScreen() {
  const saveOnScan = useAppStore.use.saveOnScan();
  const longPressAction = useAppStore.use.longPressAction();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-8" style={defaultStyles.transparentBg}>
        <DetailsSection
          className="mb-4"
          data={[{
            label: translate('settings.save_on_scan'),
            description: translate('settings.save_on_scan_description'),
            value: (
              <Switch
                accessibilityLabel={translate('settings.save_on_scan')}
                checked={!!saveOnScan}
                onChange={(checked) => {
                  updateAppState({ saveOnScan: checked });
                }}
              />
            ),
          }, {
            label: translate('settings.long_press_action'),
            description: translate('settings.long_press_action_description'),
            value: (
              <Select
                options={LONG_PRESS_ACTION_OPTIONS.map((option) => ({
                  label: translate(`settings.long_press_action_options.${option}`),
                  value: option,
                }))}
                size="sm"
                value={longPressAction}
                onSelect={(option) => {
                  updateAppState({ longPressAction: option });
                }}
              />
            ),
          }]}
        />
      </ScrollView>
    </>
  );
}

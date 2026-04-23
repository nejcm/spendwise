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
  const openTransactionDetailOnCreate = useAppStore.use.openTxOnCreate();
  const longPressAction = useAppStore.use.longPressAction();
  const recommendationsEnabled = useAppStore.use.recommendationsEnabled();

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
            label: translate('settings.open_transaction_after_create'),
            description: translate('settings.open_transaction_after_create_description'),
            value: (
              <Switch
                accessibilityLabel={translate('settings.open_transaction_after_create')}
                checked={!!openTransactionDetailOnCreate}
                onChange={(checked) => {
                  updateAppState({ openTxOnCreate: checked });
                }}
              />
            ),
          }, {
            label: translate('settings.recommendations_enabled'),
            description: translate('settings.recommendations_enabled_description'),
            value: (
              <Switch
                accessibilityLabel={translate('settings.recommendations_enabled')}
                checked={!!recommendationsEnabled}
                onChange={(checked) => {
                  updateAppState({ recommendationsEnabled: checked });
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
                containerClassName="w-36"
                value={longPressAction}
                selectedItemTextProps={{ numberOfLines: 1 }}
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

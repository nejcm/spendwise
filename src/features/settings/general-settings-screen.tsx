import * as React from 'react';
import DetailsSection from '@/components/details';
import { FocusAwareStatusBar, ScrollView, Switch } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { updateAppState, useAppStore } from '@/lib/store';
import { defaultStyles } from '@/lib/theme/styles';

export function GeneralSettingsScreen() {
  const saveOnScan = useAppStore.use.saveOnScan();

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
          }]}
        />
      </ScrollView>
    </>
  );
}

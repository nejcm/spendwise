import type { DensityType } from '@/lib/store/store';
import * as React from 'react';
import DetailsSection from '@/components/details';
import { FocusAwareStatusBar, ScrollView, Select } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { updateAppState, useAppStore } from '@/lib/store/store';
import { defaultStyles } from '@/lib/theme/styles';
import { AccentItem } from './components/accent-item';
import { SettingsContainer } from './components/settings-container';
import { ThemeItem } from './components/theme-item';

const DENSITY_OPTIONS: DensityType[] = ['default', 'compact'];

export function AppearanceSettingsScreen() {
  const density = useAppStore.use.density();

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pt-8" style={defaultStyles.transparentBg}>
        <DetailsSection
          className="mb-4"
          data={[{
            label: translate('settings.density'),
            description: translate('settings.density_description'),
            value: (
              <Select
                options={DENSITY_OPTIONS.map((option) => ({
                  label: translate(`settings.density_options.${option}`),
                  value: option,
                }))}
                size="sm"
                containerClassName="w-36"
                value={density}
                selectedItemTextProps={{ numberOfLines: 1 }}
                onSelect={(option) => {
                  updateAppState({ density: option });
                }}
              />
            ),
          }]}
        />
        <SettingsContainer>
          <ThemeItem />
          <AccentItem />
        </SettingsContainer>
      </ScrollView>
    </>
  );
}

import type { AutoBackupFileEntry, AutoBackupInterval } from '@/features/imports-export/backup-file';

import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { useState } from 'react';
import DetailsSection from '@/components/details';

import { getPressedStyle, ModalSheet, Pressable, Select, SolidButton, Switch, Text, useModalSheet, View } from '@/components/ui';
import { formatDate } from '@/features/formatting/helpers';
import { IS_AUTO_BACKUP_SUPPORTED, listAutoBackupFiles } from '@/features/imports-export/backup-file';
import { useRestoreAutoBackup } from '@/features/imports-export/hooks';
import { translate } from '@/lib/i18n';
import { updateAutoBackup, useAppStore } from '@/lib/store/store';

function autoBackupIntervalOptions(): { label: string; value: AutoBackupInterval }[] {
  return [
    { label: translate('import-export.auto_backup_interval_daily'), value: 'daily' },
    { label: translate('import-export.auto_backup_interval_weekly'), value: 'weekly' },
    { label: translate('import-export.auto_backup_interval_monthly'), value: 'monthly' },
  ];
}

export default function AutoBackupSection() {
  const autoBackup = useAppStore.use.autoBackup();
  const dateFormat = useAppStore.use.dateFormat();
  const restoreAutoBackup = useRestoreAutoBackup();
  const backupsSheet = useModalSheet();
  const [backups, setBackups] = useState<AutoBackupFileEntry[]>([]);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);

  if (!IS_AUTO_BACKUP_SUPPORTED) {
    return (
      <>
        <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.auto_backup_section_title" />
        <DetailsSection
          className="mb-8"
          data={[{
            label: translate('import-export.auto_backup_web_unavailable_title'),
            description: translate('import-export.auto_backup_web_unavailable_description'),
            value: <Text className="text-muted-foreground">—</Text>,
          }]}
        />
      </>
    );
  }

  const lastDisplay = autoBackup.lastAutoBackupAt
    ? formatDate(Math.floor(new Date(autoBackup.lastAutoBackupAt).getTime() / 1000), dateFormat)
    : translate('import-export.auto_backup_never');

  const openBackups = () => {
    setSelectedUri(null);
    setBackups(listAutoBackupFiles().slice(0, 20));
    backupsSheet.present();
  };

  return (
    <>
      <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.auto_backup_section_title" />
      <DetailsSection
        className="mb-8"
        data={[
          {
            label: translate('import-export.auto_backup_enable_label'),
            description: translate('import-export.auto_backup_enable_description'),
            value: (
              <Switch
                accessibilityLabel={translate('import-export.auto_backup_enable_label')}
                checked={autoBackup.enabled}
                onChange={(checked) => updateAutoBackup({ enabled: checked })}
              />
            ),
          },
          ...(autoBackup.enabled
            ? [{
                label: translate('import-export.auto_backup_interval_label'),
                value: (
                  <Select<AutoBackupInterval>
                    containerClassName="min-w-36"
                    size="sm"
                    options={autoBackupIntervalOptions()}
                    value={autoBackup.interval}
                    onSelect={(interval) => updateAutoBackup({ interval })}
                  />
                ),
              }]
            : []),
          {
            label: translate('import-export.auto_backup_last_label'),
            value: lastDisplay,
          },
        ]}
      >
        {autoBackup.enabled && (
          <SolidButton
            size="sm"
            className="mt-2 min-w-30"
            label={translate('import-export.auto_backup_view_backups')}
            onPress={openBackups}
            disabled={restoreAutoBackup.isPending}
          />
        )}
      </DetailsSection>

      <ModalSheet
        ref={backupsSheet.ref}
        title={translate('import-export.auto_backup_backups_title')}
        onDismiss={backupsSheet.dismiss}
        snapPoints={['60%']}
      >
        <BottomSheetScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, minHeight: '100%' }}
        >
          {backups.length === 0
            ? (
                <View className="py-6">
                  <Text className="text-center text-muted-foreground" tx="import-export.auto_backup_no_backups" />
                </View>
              )
            : (
                <View className="gap-2 py-2">
                  {backups.map((entry: AutoBackupFileEntry) => {
                    const display = formatDate(Math.floor(entry.ts / 1000), dateFormat);
                    const isSelected = selectedUri === entry.uri;
                    const isLoading = restoreAutoBackup.isPending && isSelected;

                    return (
                      <Pressable
                        key={entry.uri}
                        disabled={restoreAutoBackup.isPending}
                        onPress={() => {
                          setSelectedUri(entry.uri);
                          restoreAutoBackup.mutate(entry.uri);
                        }}
                        style={getPressedStyle}
                        className="flex-row items-center justify-between rounded-xl border border-border p-3"
                      >
                        <View className="flex-1 pr-3">
                          <Text className="font-medium text-foreground">{display}</Text>
                          <Text className="text-xs text-muted-foreground">{entry.name}</Text>
                        </View>
                        <SolidButton
                          size="sm"
                          className="min-w-20"
                          label={translate('common.restore')}
                          loading={isLoading}
                          onPress={() => {
                            setSelectedUri(entry.uri);
                            restoreAutoBackup.mutate(entry.uri);
                          }}
                          disabled={restoreAutoBackup.isPending}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              )}
        </BottomSheetScrollView>
      </ModalSheet>
    </>
  );
}

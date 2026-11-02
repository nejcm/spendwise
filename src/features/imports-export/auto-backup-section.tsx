import type { AutoBackupFileEntry, AutoBackupInterval } from '@/features/imports-export/backup-file';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { ActivityIndicator, Card, ListRow, ModalSheet, SectionHeader, SegmentedControl, SolidButton, Text, useModalSheet, View } from '@/components/ui';
import { Download, Upload } from '@/components/ui/icon';
import { translateCount } from '@/features/categories/helpers';
import { formatInstant } from '@/features/formatting/helpers';
import { DEFAULT_AUTO_BACKUP_RETENTION, listAutoBackupFiles } from '@/features/imports-export/backup-file';
import { useBackUpNow, useRestoreAutoBackup } from '@/features/imports-export/hooks';
import { ToggleRow } from '@/features/settings/components/toggle-row';
import { cn } from '@/lib/cn';
import { translate } from '@/lib/i18n';
import { updateAutoBackup, useAppStore } from '@/lib/store/store';
import { formatFileSize } from './helpers';

const INTERVALS: AutoBackupInterval[] = ['daily', 'weekly', 'monthly'];

function formatBackupTime(ms: number, dateFormat: string) {
  const time = new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${formatInstant(Math.floor(ms / 1000), dateFormat)}, ${time}`;
}

export function LastBackupCard() {
  const { lastAutoBackupAt, lastBackupStats } = useAppStore.use.autoBackup();
  const dateFormat = useAppStore.use.dateFormat();
  const numberFormat = useAppStore.use.numberFormat();
  const backUpNow = useBackUpNow();
  const restore = useRestoreAutoBackup();
  const sheet = useModalSheet();
  const [backups, setBackups] = React.useState<AutoBackupFileEntry[]>([]);

  const openRestore = () => {
    setBackups(listAutoBackupFiles().slice(0, 20));
    sheet.present();
  };

  return (
    <Card className="mt-5 p-4.5">
      <Text className="text-meta text-muted-foreground">{translate('import-export.last_backup')}</Text>
      <Text className="pt-0.5 text-page-title/8.5 font-bold tracking-tight">
        {lastAutoBackupAt ? formatBackupTime(Date.parse(lastAutoBackupAt), dateFormat) : translate('import-export.auto_backup_never')}
      </Text>
      {lastBackupStats && (
        <Text className="pt-1 text-meta text-muted-foreground">
          {[
            translateCount('import-export.stats_transactions', lastBackupStats.transactions),
            translateCount('import-export.stats_accounts', lastBackupStats.accounts),
            formatFileSize(lastBackupStats.bytes, numberFormat),
          ].join(' · ')}
        </Text>
      )}
      <View className="flex-row gap-2 pt-4">
        <SolidButton
          color="primary"
          className="flex-1"
          label={translate('import-export.back_up_now')}
          iconLeft={<Download size={18} colorClassName="accent-primary-foreground" />}
          loading={backUpNow.isPending}
          onPress={() => backUpNow.mutate()}
        />
        <SolidButton
          color="secondary"
          className="flex-1"
          label={translate('common.restore')}
          iconLeft={<Upload size={18} colorClassName="accent-foreground" />}
          disabled={restore.isPending}
          onPress={openRestore}
        />
      </View>

      <ModalSheet ref={sheet.ref} title={translate('import-export.auto_backup_backups_title')} onDismiss={sheet.close} snapPoints={['60%']}>
        <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {backups.length === 0
            ? <Text className="py-6 text-center text-muted-foreground">{translate('import-export.auto_backup_no_backups')}</Text>
            : backups.map((entry, index) => (
                <ListRow
                  key={entry.uri}
                  className={cn('min-h-14', index > 0 && 'border-t border-border')}
                  title={formatBackupTime(entry.ts, dateFormat)}
                  trailing={restore.isPending && restore.variables === entry.uri ? <ActivityIndicator /> : undefined}
                  chevron
                  disabled={restore.isPending}
                  onPress={() => restore.mutate(entry.uri, { onSuccess: sheet.close })}
                />
              ))}
        </BottomSheetScrollView>
      </ModalSheet>
    </Card>
  );
}

export function AutoBackupSection() {
  const { enabled, interval, retention } = useAppStore.use.autoBackup();
  const copies = retention ?? DEFAULT_AUTO_BACKUP_RETENTION;

  return (
    <>
      <SectionHeader title={translate('import-export.auto_backup_section_title')} />
      <Card className="px-4">
        <ToggleRow
          title={translate('import-export.auto_backup_on_open')}
          description={translateCount('import-export.auto_backup_keeps', copies)}
          checked={enabled}
          onChange={(on) => updateAutoBackup({ enabled: on })}
        />
        {enabled && (
          <SegmentedControl
            accessibilityLabel={translate('import-export.auto_backup_section_title')}
            className="mb-4"
            options={INTERVALS.map((value) => ({ value, label: translate(`import-export.auto_backup_interval_${value}`) }))}
            value={interval}
            onChange={(value) => updateAutoBackup({ interval: value })}
          />
        )}
      </Card>
    </>
  );
}

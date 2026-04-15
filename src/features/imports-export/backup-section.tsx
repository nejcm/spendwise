import * as React from 'react';
import DetailsSection from '@/components/details';

import { SolidButton, Text } from '@/components/ui';
import { Download, Upload } from '@/components/ui/icon';
import { useExportBackup, useImportBackup } from '@/features/imports-export/hooks';
import { translate } from '@/lib/i18n';

export default function BackupSection() {
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  return (
    <>
      <Text className="mb-2 font-bold dark:text-muted-foreground" tx="import-export.backup_section_title" />
      <DetailsSection
        className="mb-8"
        data={[
          {
            label: translate('import-export.backup_download_label'),
            description: translate('import-export.backup_download_description'),
            value: (
              <SolidButton
                size="sm"
                className="min-w-28"
                iconLeft={<Download className="mr-1 text-background" size={16} />}
                label={translate('common.download')}
                loading={exportBackup.isPending}
                onPress={() => void exportBackup.mutate()}
              />
            ),
          },
          {
            label: translate('import-export.backup_restore_label'),
            description: translate('import-export.backup_restore_description'),
            value: (
              <SolidButton
                size="sm"
                className="min-w-28"
                iconLeft={<Upload className="mr-1 text-background" size={16} />}
                label={translate('common.restore')}
                loading={importBackup.isPending}
                onPress={() => importBackup.mutate()}
              />
            ),
          },
        ]}
      />
    </>
  );
}

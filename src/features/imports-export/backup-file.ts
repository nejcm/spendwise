import type { SQLiteDatabase } from 'expo-sqlite';
import { Directory, File, Paths } from 'expo-file-system';
import { exportBackup } from '@/features/imports-export/backup';
import { IS_WEB } from '@/lib/base';

export const BACKUP_FILE_NAME_PREFIX = 'spendwise-backup-';
export const AUTO_BACKUP_SUBDIR = 'spendwise-auto-backups';
export const DEFAULT_AUTO_BACKUP_RETENTION = 5;

export type AutoBackupInterval = 'daily' | 'weekly' | 'monthly';

export function buildManualBackupFileName(date = new Date()): string {
  return `${BACKUP_FILE_NAME_PREFIX}${date.toISOString().slice(0, 10)}.json`;
}

export function getAutoBackupDirectory(): Directory | null {
  if (IS_WEB) return null;
  return new Directory(Paths.document, AUTO_BACKUP_SUBDIR);
}

export const IS_AUTO_BACKUP_SUPPORTED = !IS_WEB;

const INTERVAL_MS: Record<AutoBackupInterval, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export function shouldRunAutoBackup(
  lastAutoBackupAt: string | null,
  interval: AutoBackupInterval,
  now: Date = new Date(),
): boolean {
  if (lastAutoBackupAt === null) return true;
  const last = new Date(lastAutoBackupAt).getTime();
  if (Number.isNaN(last)) return true;
  return now.getTime() - last >= INTERVAL_MS[interval];
}

const AUTO_BACKUP_NAME_RE = new RegExp(`^${BACKUP_FILE_NAME_PREFIX}(\\d+)\\.json$`);

function pruneAutoBackups(dir: Directory, keepCount: number): void {
  if (!dir.exists || keepCount < 1) return;
  const listed = dir.list();
  const files: { file: File; ts: number }[] = [];
  for (const item of listed) {
    if (!(item instanceof File)) continue;
    const m = AUTO_BACKUP_NAME_RE.exec(item.name);
    if (!m) continue;
    files.push({ file: item, ts: Number(m[1]) });
  }
  if (files.length <= keepCount) return;
  files.sort((a, b) => b.ts - a.ts);
  for (const { file } of files.slice(keepCount)) {
    try {
      file.delete();
    }
    catch {
      /* ignore */
    }
  }
}

export async function writeAutoBackupFile(
  db: SQLiteDatabase,
  options: { retentionCount?: number } = {},
): Promise<{ writtenAt: string }> {
  const dir = getAutoBackupDirectory();
  if (!dir) throw new Error('auto_backup_unavailable');

  if (!dir.exists) dir.create({ idempotent: true, intermediates: true });

  const backup = await exportBackup(db);
  const json = JSON.stringify(backup, null, 2);
  const fileName = `${BACKUP_FILE_NAME_PREFIX}${Date.now()}.json`;
  const file = new File(dir, fileName);
  if (file.exists) file.delete();
  file.create({ overwrite: true });
  file.write(json);

  pruneAutoBackups(dir, options.retentionCount ?? DEFAULT_AUTO_BACKUP_RETENTION);

  return { writtenAt: backup.exported_at };
}

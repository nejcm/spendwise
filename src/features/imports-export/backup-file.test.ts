import type { BackupData } from '@/features/imports-export/backup';
import { getBackupStats, shouldRunAutoBackup, writeAutoBackupFile } from '@/features/imports-export/backup-file';
import { clearAppStore, useAppStore } from '@/lib/store/store';
import { createTestDb } from '@/test-utils/sqlite-db';

const mockFiles = new Map<string, string>();

jest.mock('expo-file-system', () => {
  class File {
    constructor(dirOrName: unknown, readonly name = dirOrName as string) {}
    get uri() { return `file:///documents/${this.name}`; }
    get exists() { return mockFiles.has(this.name); }
    get size() { return mockFiles.get(this.name)?.length ?? 0; }
    create() { mockFiles.set(this.name, ''); }
    write(content: string) { mockFiles.set(this.name, content); }
    delete() { mockFiles.delete(this.name); }
  }
  class Directory {
    exists = true;
    create() {}
    list() { return [...mockFiles.keys()].map((name) => new File(name)); }
  }
  return { Directory, File, Paths: { document: 'documents' } };
});

describe('shouldRunAutoBackup', () => {
  it('returns true when last backup is null', () => {
    expect(shouldRunAutoBackup(null, 'daily', new Date('2026-01-10T12:00:00.000Z'))).toBe(true);
  });

  it('returns false before daily interval elapses', () => {
    expect(
      shouldRunAutoBackup(
        '2026-01-10T11:00:00.000Z',
        'daily',
        new Date('2026-01-10T12:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('returns true after daily interval elapses', () => {
    expect(
      shouldRunAutoBackup(
        '2026-01-09T12:00:00.000Z',
        'daily',
        new Date('2026-01-10T12:00:00.000Z'),
      ),
    ).toBe(true);
  });

  it('returns true for invalid last timestamp', () => {
    expect(shouldRunAutoBackup('not-a-date', 'weekly', new Date('2026-01-10T12:00:00.000Z'))).toBe(true);
  });
});

describe('getBackupStats', () => {
  it('counts both legs of a transfer once', () => {
    const transactions = [
      { id: 'a', transfer_id: null },
      { id: 'b', transfer_id: 't1' },
      { id: 'c', transfer_id: 't1' },
    ] as BackupData['transactions'];
    const accounts = [{ id: 'x' }, { id: 'y' }] as BackupData['accounts'];

    expect(getBackupStats({ transactions, accounts }, 2048)).toEqual({ transactions: 2, accounts: 2, bytes: 2048 });
  });
});

describe('writeAutoBackupFile', () => {
  beforeEach(() => {
    clearAppStore();
    mockFiles.clear();
    jest.useFakeTimers().setSystemTime(5_000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('writes a backup, then prunes only the oldest auto backups past the retention count', async () => {
    const db = await createTestDb();
    for (const name of ['spendwise-backup-1000.json', 'spendwise-backup-2000.json', 'spendwise-backup-3000.json', 'spendwise-backup-2026-01-10.json', 'notes.txt']) {
      mockFiles.set(name, '{}');
    }

    await writeAutoBackupFile(db as any, { retentionCount: 2 });

    expect([...mockFiles.keys()].sort()).toEqual([
      'notes.txt',
      'spendwise-backup-2026-01-10.json',
      'spendwise-backup-3000.json',
      'spendwise-backup-5000.json',
    ]);
    expect(JSON.parse(mockFiles.get('spendwise-backup-5000.json')!)).toMatchObject({ transactions: [], accounts: [] });
    expect(useAppStore.getState().autoBackup.lastAutoBackupAt).toBe('1970-01-01T00:00:05.000Z');
  });
});

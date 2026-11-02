import type { BackupData } from '@/features/imports-export/backup';
import { getBackupStats, shouldRunAutoBackup } from '@/features/imports-export/backup-file';

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

import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import * as SplashScreen from 'expo-splash-screen';

import { ensureAndroidChannel } from '@/features/notifications/notifications';
import { syncDueScheduledTransactions } from '@/features/scheduled-transactions/api';
import { migrateDb } from '@/lib/sqlite';
import { bootstrapApp } from './app-bootstrap';

jest.mock('@/lib/sqlite', () => ({
  migrateDb: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/features/notifications/notifications', () => ({
  ensureAndroidChannel: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/features/scheduled-transactions/api', () => ({
  syncDueScheduledTransactions: jest.fn().mockResolvedValue(0),
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('bootstrapApp', () => {
  const db = {} as SQLiteDatabase;
  const qc = {} as QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs startup steps in order', async () => {
    const order: string[] = [];

    (migrateDb as jest.Mock).mockImplementation(async () => {
      order.push('migrate');
    });
    (ensureAndroidChannel as jest.Mock).mockImplementation(async () => {
      order.push('channel');
    });
    (syncDueScheduledTransactions as jest.Mock).mockImplementation(async () => {
      order.push('sync');
    });

    await bootstrapApp(db, qc);

    expect(SplashScreen.hideAsync).toHaveBeenCalled();
    expect(order).toEqual(['migrate', 'channel', 'sync']);
    expect(migrateDb).toHaveBeenCalledWith(db);
    expect(ensureAndroidChannel).toHaveBeenCalledWith();
    expect(syncDueScheduledTransactions).toHaveBeenCalledWith(db, qc);
  });
});

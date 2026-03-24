import type { QueryClient } from '@tanstack/react-query';
import type { SQLiteDatabase } from 'expo-sqlite';

import { checkUpcomingBills, setupNotifications } from '@/features/notifications/notifications';

import { syncDueScheduledTransactions } from '@/features/scheduled-transactions/api';
import { migrateDb } from '@/lib/sqlite';
import { bootstrapApp } from './app-bootstrap';

jest.mock('@/lib/sqlite', () => ({
  migrateDb: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/features/notifications/notifications', () => ({
  setupNotifications: jest.fn().mockResolvedValue(undefined),
  checkUpcomingBills: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/features/scheduled-transactions/api', () => ({
  syncDueScheduledTransactions: jest.fn().mockResolvedValue(0),
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
    (setupNotifications as jest.Mock).mockImplementation(async () => {
      order.push('notifications');
    });
    (syncDueScheduledTransactions as jest.Mock).mockImplementation(async () => {
      order.push('sync');
    });
    (checkUpcomingBills as jest.Mock).mockImplementation(async () => {
      order.push('bills');
    });

    await bootstrapApp(db, qc);

    expect(order).toEqual(['migrate', 'notifications', 'sync', 'bills']);
    expect(migrateDb).toHaveBeenCalledWith(db);
    expect(setupNotifications).toHaveBeenCalledWith();
    expect(syncDueScheduledTransactions).toHaveBeenCalledWith(db, qc);
    expect(checkUpcomingBills).toHaveBeenCalledWith(db);
  });
});

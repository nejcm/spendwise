import type { SQLiteDatabase } from 'expo-sqlite';

import * as SplashScreen from 'expo-splash-screen';

import { ensureAndroidChannel } from '@/features/notifications/notifications';
import { migrateDb } from '@/lib/sqlite';
import { bootstrapApp } from './app-bootstrap';

jest.mock('@/lib/sqlite', () => ({
  migrateDb: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/features/notifications/notifications', () => ({
  ensureAndroidChannel: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('bootstrapApp', () => {
  const db = {} as SQLiteDatabase;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs startup steps in order', async () => {
    jest.useFakeTimers();
    const order: string[] = [];

    (migrateDb as jest.Mock).mockImplementation(async () => {
      order.push('migrate');
    });
    (ensureAndroidChannel as jest.Mock).mockImplementation(async () => {
      order.push('channel');
    });

    try {
      await bootstrapApp(db);

      expect(SplashScreen.hideAsync).toHaveBeenCalled();
      expect(order).toEqual(['migrate', 'channel']);
      expect(migrateDb).toHaveBeenCalledWith(db);
      expect(ensureAndroidChannel).toHaveBeenCalledWith();
      expect(jest.getTimerCount()).toBe(0);
    }
    finally {
      jest.useRealTimers();
    }
  });
});

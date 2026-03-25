import type { SQLiteDatabase } from 'expo-sqlite';

import type { NotificationSettings } from '../types';
import { todayISO } from '@/features/formatting/helpers';
import { translate } from '@/lib/i18n';
import { storage } from '@/lib/storage';
import { send } from '../notifications';
import { getAccountBalances } from '../queries';

function lowBalanceKey(accountId: string, date: string) {
  return `notif.balance.${accountId}.${date}`;
}

export async function checkLowBalance(
  db: SQLiteDatabase,
  settings: NotificationSettings,
): Promise<void> {
  if (settings.lowBalance !== true) return;

  const threshold = settings.lowBalanceThresholdCents ?? 5000;
  const today = todayISO();
  const accounts = await getAccountBalances(db);

  for (const account of accounts) {
    if (account.baseBalance < threshold) {
      const key = lowBalanceKey(account.id, today);
      if (storage.getString(key) !== '1') {
        await send(
          translate('notifications.low_balance_title'),
          translate('notifications.low_balance_body', { name: account.name } as never),
        );
        storage.set(key, '1');
      }
    }
  }
}

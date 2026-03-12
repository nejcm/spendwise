import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';

import * as schema from './schema';

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

// TODO: improve this
// Assigned once by initDb() before any queries run
// eslint-disable-next-line import/no-mutable-exports
export let db = undefined as unknown as DrizzleDB;

export async function initDb(): Promise<DrizzleDB> {
  const expo = await openDatabaseAsync('spendwise.db', { enableChangeListener: true });
  db = drizzle(expo, { schema });
  return db;
}

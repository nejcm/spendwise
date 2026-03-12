import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expo = openDatabaseSync('spendwise.db', { enableChangeListener: true });

export const db = drizzle(expo, { schema });

export type DrizzleDB = typeof db;

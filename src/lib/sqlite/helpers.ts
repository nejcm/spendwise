import type { SQLiteDatabase } from 'expo-sqlite';

import { randomUUID } from 'expo-crypto';

/**
 * Generate a new UUID for use as a primary key.
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Insert a row into a table and return the generated ID.
 */
export async function insertRow(db: SQLiteDatabase, table: string, data: Record<string, unknown>): Promise<string> {
  const id = (data.id as string) || generateId();
  const entries = Object.entries({ ...data, id });
  const columns = entries.map(([key]) => key).join(', ');
  const placeholders = entries.map(() => '?').join(', ');
  const values = entries.map(([_, value]) => value);

  await db.runAsync(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, values as (string | number | null)[]);

  return id;
}

type UpdateRowArgs = {
  db: SQLiteDatabase;
  table: string;
  id: string;
  data: Record<string, unknown>;
};

/**
 * Update a row by ID.
 */
export async function updateRow(args: UpdateRowArgs): Promise<void> {
  const { db, table, id, data } = args;
  const entries = Object.entries(data);
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([_, value]) => value);

  await db.runAsync(`UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, [...values, id] as (
    | string
    | number
    | null
  )[]);
}

/**
 * Delete a row by ID.
 */
export async function deleteRow(db: SQLiteDatabase, table: string, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, [id]);
}

/**
 * Get a single row by ID.
 */
export async function getById<T>(db: SQLiteDatabase, table: string, id: string): Promise<T | null> {
  return db.getFirstAsync<T>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}

/**
 * Get all rows from a table with optional ordering.
 */
export async function getAll<T>(db: SQLiteDatabase, table: string, orderBy: string = 'created_at DESC'): Promise<T[]> {
  return db.getAllAsync<T>(`SELECT * FROM ${table} ORDER BY ${orderBy}`);
}

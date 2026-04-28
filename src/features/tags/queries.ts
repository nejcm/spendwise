import type { SQLiteDatabase } from 'expo-sqlite';
import type { Tag, TagFormData } from './types';
import { generateId } from '@/lib/sqlite';

export async function getTags(db: SQLiteDatabase): Promise<Tag[]> {
  return db.getAllAsync<Tag>(
    `SELECT * FROM tags ORDER BY sort_order ASC, created_at ASC`,
  );
}

export async function createTag(db: SQLiteDatabase, data: TagFormData): Promise<string> {
  const id = generateId();
  await db.runAsync(
    `INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
    [id, data.name.trim(), data.color],
  );
  return id;
}

export async function updateTag(db: SQLiteDatabase, id: string, data: TagFormData): Promise<void> {
  await db.runAsync(
    `UPDATE tags SET name = ?, color = ? WHERE id = ?`,
    [data.name.trim(), data.color, id],
  );
}

export async function deleteTag(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(`DELETE FROM tags WHERE id = ?`, [id]);
}

export async function getTagsForTransaction(
  db: SQLiteDatabase,
  transactionId: string,
): Promise<Tag[]> {
  return db.getAllAsync<Tag>(
    `SELECT t.* FROM tags t
     INNER JOIN transaction_tags tt ON tt.tag_id = t.id
     WHERE tt.transaction_id = ?
     ORDER BY t.sort_order ASC, t.created_at ASC`,
    [transactionId],
  );
}

export async function getTransactionIdsForTag(
  db: SQLiteDatabase,
  tagId: string,
): Promise<string[]> {
  const rows = await db.getAllAsync<{ transaction_id: string }>(
    `SELECT transaction_id FROM transaction_tags WHERE tag_id = ?`,
    [tagId],
  );
  return rows.map((r) => r.transaction_id);
}

export async function setTransactionTags(
  db: SQLiteDatabase,
  transactionId: string,
  tagIds: string[],
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM transaction_tags WHERE transaction_id = ?`,
      [transactionId],
    );
    for (const tagId of tagIds) {
      await db.runAsync(
        `INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
        [transactionId, tagId],
      );
    }
  });
}

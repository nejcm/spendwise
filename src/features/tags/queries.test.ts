import { createTestDb } from '@/test-utils/sqlite-db';

import {
  createTag,
  deleteTag,
  getTags,
  getTagsForTransaction,
  setTransactionTags,
  updateTag,
} from './queries';

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `id_${++n}`) };
});

async function seedAccount(db: Awaited<ReturnType<typeof createTestDb>>) {
  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, is_archived, sort_order) VALUES ('acc_1', 'Test', 'checking', 'EUR', 0, 0)`,
    [],
  );
}

async function seedTransaction(db: Awaited<ReturnType<typeof createTestDb>>, id: string) {
  await db.runAsync(
    `INSERT INTO transactions (id, account_id, type, amount, currency, baseAmount, baseCurrency, date)
     VALUES (?, 'acc_1', 'expense', 1000, 'EUR', 1000, 'EUR', 1700000000)`,
    [id],
  );
}

describe('tags queries', () => {
  it('getTags returns empty array when no tags exist', async () => {
    const db = await createTestDb();
    expect(await getTags(db as any)).toEqual([]);
  });

  it('createTag inserts a tag and getTags returns it', async () => {
    const db = await createTestDb();
    await createTag(db as any, { name: 'Business', color: '#ff0000' });
    const tags = await getTags(db as any);
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Business');
    expect(tags[0].color).toBe('#ff0000');
  });

  it('updateTag changes name and color', async () => {
    const db = await createTestDb();
    const id = await createTag(db as any, { name: 'Old', color: '#000' });
    await updateTag(db as any, id, { name: 'New', color: '#fff' });
    const tags = await getTags(db as any);
    expect(tags[0].name).toBe('New');
    expect(tags[0].color).toBe('#fff');
  });

  it('deleteTag removes the tag', async () => {
    const db = await createTestDb();
    const id = await createTag(db as any, { name: 'Temp', color: '#abc' });
    await deleteTag(db as any, id);
    expect(await getTags(db as any)).toEqual([]);
  });
});

describe('transaction_tags queries', () => {
  it('getTagsForTransaction returns empty array when no tags assigned', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, 'tx_1');
    expect(await getTagsForTransaction(db as any, 'tx_1')).toEqual([]);
  });

  it('setTransactionTags assigns tags and getTagsForTransaction returns them', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, 'tx_1');
    const id1 = await createTag(db as any, { name: 'Work', color: '#111' });
    const id2 = await createTag(db as any, { name: 'Travel', color: '#222' });

    await setTransactionTags(db as any, 'tx_1', [id1, id2]);
    const tags = await getTagsForTransaction(db as any, 'tx_1');
    expect(tags.map((t) => t.id).sort()).toEqual([id1, id2].sort());
  });

  it('setTransactionTags replaces existing tags on second call', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, 'tx_1');
    const id1 = await createTag(db as any, { name: 'A', color: '#aaa' });
    const id2 = await createTag(db as any, { name: 'B', color: '#bbb' });

    await setTransactionTags(db as any, 'tx_1', [id1, id2]);
    await setTransactionTags(db as any, 'tx_1', [id2]);
    const tags = await getTagsForTransaction(db as any, 'tx_1');
    expect(tags).toHaveLength(1);
    expect(tags[0].id).toBe(id2);
  });

  it('setTransactionTags with empty array removes all tags', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, 'tx_1');
    const id1 = await createTag(db as any, { name: 'X', color: '#xyz' });
    await setTransactionTags(db as any, 'tx_1', [id1]);
    await setTransactionTags(db as any, 'tx_1', []);
    expect(await getTagsForTransaction(db as any, 'tx_1')).toEqual([]);
  });

  it('deleting a tag cascades to remove transaction_tags entries', async () => {
    const db = await createTestDb();
    await seedAccount(db);
    await seedTransaction(db, 'tx_1');
    const id1 = await createTag(db as any, { name: 'Z', color: '#zzz' });
    await setTransactionTags(db as any, 'tx_1', [id1]);
    await deleteTag(db as any, id1);
    expect(await getTagsForTransaction(db as any, 'tx_1')).toEqual([]);
  });
});

import { createTestDb } from '@/test-utils/sqlite-db';

import { createCategory, getCategories, updateCategory } from './queries';

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'cat-uuid'),
}));

describe('category kind', () => {
  it('stores the kind on insert and update', async () => {
    const db = await createTestDb();
    await createCategory(db as any, { name: 'Salary', icon: null, color: '#00FF00', kind: 'income' });
    expect(await getCategories(db as any)).toMatchObject([{ id: 'cat-uuid', kind: 'income' }]);

    await updateCategory(db as any, 'cat-uuid', { name: 'Salary', icon: null, color: '#00FF00', kind: 'expense' });
    expect(await getCategories(db as any)).toMatchObject([{ id: 'cat-uuid', kind: 'expense' }]);
  });

  it('rejects an unknown kind', async () => {
    const db = await createTestDb();
    await expect(createCategory(db as any, { name: 'X', icon: null, color: '#000', kind: 'transfer' as any }))
      .rejects
      .toHaveProperty('message', expect.stringMatching(/CHECK constraint failed/));
  });
});

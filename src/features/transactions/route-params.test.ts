import { parseTransactionsRouteSeed } from './route-params';

describe('parseTransactionsRouteSeed', () => {
  it('parses seeded filters and search', () => {
    expect(parseTransactionsRouteSeed({
      accountId: 'acc_1',
      categoryId: 'cat_1',
      search: ' coffee ',
      type: 'expense',
    })).toEqual({
      search: 'coffee',
      filters: {
        accountId: 'acc_1',
        categoryId: 'cat_1',
        tagId: null,
        type: 'expense',
      },
    });
  });

  it('ignores invalid type and invalid date ranges', () => {
    expect(parseTransactionsRouteSeed({
      type: 'weird',
    })).toEqual({
      search: '',
      filters: {
        accountId: null,
        categoryId: null,
        tagId: null,
        type: null,
      },
    });
  });

  it('uses the first value when params arrive as arrays', () => {
    expect(parseTransactionsRouteSeed({
      accountId: ['acc_1', 'acc_2'],
      search: ['rent', 'ignored'],
    })).toEqual({
      search: 'rent',
      filters: {
        accountId: 'acc_1',
        categoryId: null,
        tagId: null,
        type: null,
      },
    });
  });

  it('parses tagId from route params', () => {
    expect(parseTransactionsRouteSeed({ tagId: 'tag_1' })).toEqual({
      search: '',
      filters: {
        accountId: null,
        categoryId: null,
        tagId: 'tag_1',
        type: null,
      },
    });
  });
});

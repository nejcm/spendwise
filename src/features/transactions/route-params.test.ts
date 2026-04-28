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
        type: null,
      },
    });
  });
});

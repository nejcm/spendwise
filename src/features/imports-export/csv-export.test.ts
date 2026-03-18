import { formatTransactionsCsv } from '@/features/imports-export/csv-export';

describe('formatTransactionsCsv', () => {
  it('formats a basic transaction row with a stable header', () => {
    const csv = formatTransactionsCsv([
      {
        id: 'txn_1',
        date: '2026-03-18',
        type: 'expense',
        amount: 12345,
        currency: 'EUR',
        note: 'Lunch',
        account_id: 'acc_1',
        account_name: 'Main account',
        account_type: 'checking',
        account_currency: 'EUR',
        account_icon: '🏦',
        category_id: 'cat_1',
        category_name: 'Food',
        category_icon: '🍔',
        category_color: '#FF0000',
        created_at: '2026-03-18T10:00:00.000Z',
        updated_at: '2026-03-18T11:00:00.000Z',
      },
    ]);

    expect(csv).toContain('id,date,type,amount,currency,note');
    expect(csv).toContain('txn_1,2026-03-18,expense,123.45,EUR,Lunch');
  });

  it('exports null joined fields and note as empty cells', () => {
    const csv = formatTransactionsCsv([
      {
        id: 'txn_2',
        date: '2026-03-18',
        type: 'income',
        amount: 5000,
        currency: 'USD',
        note: null,
        account_id: 'acc_2',
        account_name: null,
        account_type: null,
        account_currency: null,
        account_icon: null,
        category_id: null,
        category_name: null,
        category_icon: null,
        category_color: null,
        created_at: '2026-03-18T10:00:00.000Z',
        updated_at: '2026-03-18T11:00:00.000Z',
      },
    ]);

    expect(csv).toContain('txn_2,2026-03-18,income,50.00,USD,,acc_2,,,,,');
    expect(csv).not.toContain('null');
    expect(csv).not.toContain('undefined');
  });

  it('escapes commas quotes and newlines in text fields', () => {
    const csv = formatTransactionsCsv([
      {
        id: 'txn_3',
        date: '2026-03-18',
        type: 'expense',
        amount: 1000,
        currency: 'USD',
        note: 'Lunch, "team"\nmeeting',
        account_id: 'acc_3',
        account_name: 'Shared, card',
        account_type: 'credit_card',
        account_currency: 'USD',
        account_icon: '💳',
        category_id: 'cat_3',
        category_name: 'Work',
        category_icon: '💼',
        category_color: '#123456',
        created_at: '2026-03-18T10:00:00.000Z',
        updated_at: '2026-03-18T11:00:00.000Z',
      },
    ]);

    expect(csv).toContain('"Lunch, ""team""\nmeeting"');
    expect(csv).toContain('"Shared, card"');
  });

  it('preserves input order for multiple rows', () => {
    const csv = formatTransactionsCsv([
      {
        id: 'txn_first',
        date: '2026-03-01',
        type: 'income',
        amount: 100,
        currency: 'EUR',
        note: 'First',
        account_id: 'acc_1',
        account_name: 'A',
        account_type: 'cash',
        account_currency: 'EUR',
        account_icon: null,
        category_id: 'cat_1',
        category_name: 'Salary',
        category_icon: null,
        category_color: null,
        created_at: '2026-03-01T10:00:00.000Z',
        updated_at: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'txn_second',
        date: '2026-03-02',
        type: 'expense',
        amount: 200,
        currency: 'EUR',
        note: 'Second',
        account_id: 'acc_1',
        account_name: 'A',
        account_type: 'cash',
        account_currency: 'EUR',
        account_icon: null,
        category_id: 'cat_2',
        category_name: 'Food',
        category_icon: null,
        category_color: null,
        created_at: '2026-03-02T10:00:00.000Z',
        updated_at: '2026-03-02T10:00:00.000Z',
      },
    ]);

    expect(csv.indexOf('txn_first')).toBeLessThan(csv.indexOf('txn_second'));
  });
});

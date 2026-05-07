import { parseScheduledFormInitialValues, parseTransactionFormInitialValues } from './form-route-params';

describe('parseTransactionFormInitialValues', () => {
  it('parses primitive transaction form defaults', () => {
    expect(parseTransactionFormInitialValues({
      amount: '12.99',
      category_id: 'cat_1',
      currency: 'EUR',
      date: '2026-05-07',
      location: 'Berlin',
      merchant_name: 'Coffee Bar',
      note: 'Lunch',
      type: 'expense',
    })).toEqual({
      amount: '12.99',
      category_id: 'cat_1',
      currency: 'EUR',
      date: '2026-05-07',
      location: 'Berlin',
      merchant_name: 'Coffee Bar',
      note: 'Lunch',
      type: 'expense',
    });
  });

  it('ignores invalid transaction defaults', () => {
    expect(parseTransactionFormInitialValues({
      amount: '-1',
      currency: 'NOPE',
      type: 'weird',
    })).toBeUndefined();
  });

  it('ignores zero and array transaction params', () => {
    expect(parseTransactionFormInitialValues({
      amount: '0',
      currency: ['EUR', 'USD'],
      note: ['Lunch'],
      type: ['expense'],
    })).toBeUndefined();
  });

  it('normalizes blank nullable transaction params', () => {
    expect(parseTransactionFormInitialValues({
      location: '   ',
      merchant_name: '',
      note: '  ',
    })).toEqual({
      location: null,
      merchant_name: null,
      note: null,
    });
  });
});

describe('parseScheduledFormInitialValues', () => {
  it('parses scheduled form defaults', () => {
    expect(parseScheduledFormInitialValues({
      account_id: 'acc_1',
      amount: '12.99',
      category_id: 'cat_1',
      currency: 'USD',
      frequency: 'monthly',
      is_active: '1',
      note: 'Rent',
      start_date: '2026-05-07',
      type: 'expense',
    })).toEqual({
      account_id: 'acc_1',
      amount: '12.99',
      category_id: 'cat_1',
      currency: 'USD',
      frequency: 'monthly',
      is_active: true,
      note: 'Rent',
      start_date: '2026-05-07',
      type: 'expense',
    });
  });

  it('ignores invalid scheduled enum and array params', () => {
    expect(parseScheduledFormInitialValues({
      currency: ['USD'],
      frequency: 'never',
      is_active: ['1'],
      type: 'transfer',
    })).toBeUndefined();
  });

  it('parses false scheduled booleans and empty end dates', () => {
    expect(parseScheduledFormInitialValues({
      end_date: '',
      is_active: 'false',
    })).toEqual({
      end_date: null,
      is_active: false,
    });
  });
});

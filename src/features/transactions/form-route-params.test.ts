import { RECURRING_TEMPLATES } from '@/features/scheduled-transactions/constants';
import { templateParams } from '@/features/scheduled-transactions/helpers';
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

  it('parses transfer defaults with a destination account', () => {
    expect(parseTransactionFormInitialValues({
      account_id: 'acc_1',
      to_account_id: 'acc_2',
      type: 'transfer',
    })).toEqual({
      account_id: 'acc_1',
      to_account_id: 'acc_2',
      type: 'transfer',
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

  it.each([
    ['12.50', '12.50'],
    ['12,50', '12.50'],
    ['€12.50', '12.50'],
    ['12,50 €', '12.50'],
    ['12,50\u00A0€', '12.50'],
    ['1.234,56', '1234.56'],
    ['1,234.56', '1234.56'],
    ['$1,234', '1234'],
    ['1 234,5', '1234.5'],
    ['7', '7'],
    [',5', '0.5'],
  ])('parses the Shortcuts amount %s', (amount: string, expected: string) => {
    expect(parseTransactionFormInitialValues({ amount })).toEqual({ amount: expected });
  });

  it.each(['-12.50', '−12.50', '($12.50)', '€0,00', '1e3', 'twelve', '12.50abcde', '12.3456', '1..2', '1,23,456'])('rejects the amount %s', (amount: string) => {
    expect(parseTransactionFormInitialValues({ amount })).toBeUndefined();
  });

  it('takes the currency from an ISO code in the amount unless a currency param is given', () => {
    expect(parseTransactionFormInitialValues({ amount: '12,50 EUR', merchant_name: 'Café Ü' })).toEqual({ amount: '12.50', currency: 'EUR', merchant_name: 'Café Ü' });
    expect(parseTransactionFormInitialValues({ amount: 'USD 3.20', currency: 'GBP' })).toEqual({ amount: '3.20', currency: 'GBP' });
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

  it('round-trips every recurring template', () => {
    for (const template of RECURRING_TEMPLATES) {
      const params = templateParams(template, { name: 'X', categories: [], currency: 'EUR', today: '2026-11-02' });
      expect(parseScheduledFormInitialValues(params)).toEqual({ ...params, note: 'X' });
    }
  });

  it('ignores invalid scheduled amounts and keeps an empty category', () => {
    expect(parseScheduledFormInitialValues({ amount: 'abc', category_id: '' })).toEqual({ category_id: '' });
    expect(parseScheduledFormInitialValues({ amount: '-5' })).toBeUndefined();
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

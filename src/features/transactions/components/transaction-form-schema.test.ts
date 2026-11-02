import type { TransactionWithCategory } from '../types';
import { transactionFormDefaultValues, transactionFormSchema, transactionToFormValues } from './transaction-form-schema';

const valid = { ...transactionFormDefaultValues, amount: '10', account_id: 'acc_1', category_id: 'cat_1' };
const issuePaths = (value: unknown) => transactionFormSchema.safeParse(value).error?.issues.map((i) => i.path.join('.')) ?? [];

describe('transactionFormSchema', () => {
  it('requires a category for income and expense only', () => {
    expect(issuePaths({ ...valid, category_id: '' })).toEqual(['category_id']);
    expect(issuePaths({ ...valid, type: 'transfer', category_id: '', to_account_id: 'acc_2' })).toEqual([]);
  });

  it('requires a different destination account for a paired transfer', () => {
    expect(issuePaths({ ...valid, type: 'transfer', to_account_id: '' })).toEqual(['to_account_id']);
    expect(issuePaths({ ...valid, type: 'transfer', to_account_id: 'acc_1' })).toEqual(['to_account_id']);
  });

  it('accepts a legacy single leg without a destination', () => {
    expect(issuePaths({ ...valid, type: 'transfer', to_account_id: null })).toEqual([]);
  });
});

describe('transactionToFormValues', () => {
  const row = {
    id: 'in_leg',
    type: 'transfer',
    account_id: 'acc_usd',
    category_id: null,
    amount: 5500,
    currency: 'USD',
    baseAmount: 5000,
    date: 1_772_323_200,
    note: null,
    merchant_name: null,
    location: null,
    transfer_id: 'tr_1',
    counter_account_id: 'acc_1',
    counter_amount: -5000,
    counter_currency: 'EUR',
  } as TransactionWithCategory;

  it('opens an in leg as its pair, from the out leg side', () => {
    expect(transactionToFormValues(row)).toMatchObject({
      id: 'in_leg',
      account_id: 'acc_1',
      to_account_id: 'acc_usd',
      amount: 5000,
      currency: 'EUR',
      category_id: '',
      date: '2026-03-01',
    });
  });

  it('opens a legacy leg with an absolute amount and no destination', () => {
    expect(transactionToFormValues({ ...row, transfer_id: null, counter_account_id: null, amount: -300 })).toMatchObject({
      account_id: 'acc_usd',
      to_account_id: null,
      amount: 300,
    });
  });
});

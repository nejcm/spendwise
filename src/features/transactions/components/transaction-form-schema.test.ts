import type { TransactionWithCategory } from '../types';
import { adjustmentFormSchema, nextEntryValues, transactionFormDefaultValues, transactionFormSchema, transactionToFormValues } from './transaction-form-schema';

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

  it('rejects partial or impossible calendar dates', () => {
    expect(issuePaths({ ...valid, date: '2026-11-0' })).toEqual(['date']);
    expect(issuePaths({ ...valid, date: '2026-02-30' })).toEqual(['date']);
    expect(issuePaths({ ...valid, date: '2026-02-28' })).toEqual([]);
  });

  it('rejects a negative base amount as invalid, not missing', () => {
    expect(transactionFormSchema.safeParse({ ...valid, baseAmount: '-5' }).error?.issues).toMatchObject([{ path: ['baseAmount'], message: 'Enter a positive amount' }]);
    expect(issuePaths({ ...valid, baseAmount: null })).toEqual([]);
  });

  it('accepts a legacy single leg without a destination', () => {
    expect(issuePaths({ ...valid, type: 'transfer', to_account_id: null })).toEqual([]);
  });

  it('accepts a signed non-zero amount only for an opening balance', () => {
    const adjustment = { ...valid, type: 'transfer', category_id: '', to_account_id: null, amount: '-100' };
    expect(issuePaths(adjustment)).toEqual(['amount']);
    expect(adjustmentFormSchema.safeParse(adjustment).success).toBe(true);
    expect(adjustmentFormSchema.safeParse({ ...adjustment, amount: '0' }).success).toBe(false);
    expect(adjustmentFormSchema.safeParse({ ...adjustment, amount: '-' }).success).toBe(false);
  });
});

describe('tags', () => {
  it('defaults to none and enforces the count and length limits', () => {
    expect(transactionFormDefaultValues.tags).toEqual([]);
    expect(issuePaths({ ...valid, tags: Array.from({ length: 20 }, (_, i) => `t${i}`) })).toEqual([]);
    expect(issuePaths({ ...valid, tags: Array.from({ length: 21 }, (_, i) => `t${i}`) })).toEqual(['tags']);
    expect(transactionFormSchema.safeParse({ ...valid, tags: ['x'.repeat(41)] }).error?.issues).toMatchObject([{ path: ['tags', 0], message: 'Max 40 characters' }]);
    expect(issuePaths({ ...valid, tags: ['  '] })).toEqual(['tags.0']);
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
    tags: ['Lisbon', 'Work'],
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
      tags: ['Lisbon', 'Work'],
    });
  });

  it('opens a legacy leg with an absolute amount and no destination', () => {
    expect(transactionToFormValues({ ...row, transfer_id: null, counter_account_id: null, amount: -300 })).toMatchObject({
      account_id: 'acc_usd',
      to_account_id: null,
      amount: 300,
    });
  });

  it('opens an opening balance with its signed amount', () => {
    expect(transactionToFormValues({ ...row, transfer_id: null, counter_account_id: null, amount: -300, is_adjustment: 1 }).amount).toBe(-300);
  });
});

describe('nextEntryValues', () => {
  it('clears amount, merchant and note but keeps type, accounts, date, category and tags', () => {
    const filled = {
      ...valid,
      type: 'transfer' as const,
      to_account_id: 'acc_2',
      date: '2026-10-31',
      currency: 'USD' as const,
      baseAmount: '8.46',
      merchant_name: 'Pizzeria',
      note: 'Lunch',
      location: 'Ljubljana',
      tags: ['Lisbon'],
    };
    expect(nextEntryValues(filled)).toEqual({
      ...filled,
      amount: '',
      baseAmount: '',
      merchant_name: null,
      note: null,
      location: null,
    });
  });
});

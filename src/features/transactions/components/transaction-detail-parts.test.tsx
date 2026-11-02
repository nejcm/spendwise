import type { TransactionWithCategory } from '../types';
import { translate } from '@/lib/i18n';
import { cleanup, render, screen } from '@/lib/test-utils';
import { DetailHero, DetailRows } from './transaction-detail-parts';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/features/accounts/api', () => ({ useAccounts: () => ({ data: [] }) }));

afterEach(cleanup);

const DAY = Date.UTC(2026, 0, 15) / 1000;

function txn(overrides: Partial<TransactionWithCategory> = {}): TransactionWithCategory {
  return {
    id: 't1',
    account_id: 'a1',
    category_id: null,
    type: 'transfer',
    amount: -10_000,
    currency: 'EUR',
    baseAmount: 10_000,
    baseCurrency: 'EUR',
    date: DAY,
    note: null,
    merchant_name: null,
    merchant_logo_slug: null,
    location: null,
    transfer_id: null,
    is_adjustment: 1,
    created_at: DAY,
    updated_at: DAY,
    account_name: 'Cash',
    category_name: null,
    category_icon: null,
    category_color: null,
    counter_account_id: null,
    counter_account_name: null,
    counter_account_icon: null,
    counter_amount: null,
    counter_currency: null,
    ...overrides,
  };
}

describe('transaction detail parts', () => {
  it('shows a negative adjustment with a minus sign', () => {
    render(<DetailHero transaction={txn()} />);
    expect(screen.getByText(/^-.*100/)).toBeOnTheScreen();
  });

  it('shows a positive adjustment with a plus sign', () => {
    render(<DetailHero transaction={txn({ amount: 10_000 })} />);
    expect(screen.getByText(/^\+.*100/)).toBeOnTheScreen();
  });

  it('shows a paused rule without its next date', () => {
    render(<DetailRows transaction={txn()} rule={{ id: 'r1', frequency: 'monthly', next_due_date: DAY, is_active: 0, generated: 1 }} />);
    expect(screen.getByText(`${translate('scheduled.frequencyOptions.monthly')} · ${translate('common.paused')}`)).toBeOnTheScreen();
  });

  it('shows the next date for an active rule', () => {
    render(<DetailRows transaction={txn()} rule={{ id: 'r1', frequency: 'monthly', next_due_date: DAY, is_active: 1, generated: 1 }} />);
    expect(screen.getByText(translate('transactions.detail.repeats_value', { frequency: translate('scheduled.frequencyOptions.monthly'), date: 'Jan 15' }))).toBeOnTheScreen();
  });

  it('shows a long note without clamping it', () => {
    const note = 'A very long note '.repeat(20).trim();
    render(<DetailRows transaction={txn({ note })} />);
    expect(screen.getByText(note).props.numberOfLines).toBeUndefined();
  });
});

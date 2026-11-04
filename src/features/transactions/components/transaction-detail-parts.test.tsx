import type { TransactionWithCategory } from '../types';
import { translate } from '@/lib/i18n';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';
import { filterTransactions, summarizeTransactions } from '../filters';
import { parseTransactionsRouteSeed } from '../route-params';
import { DetailHero, DetailRows } from './transaction-detail-parts';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
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
    tags: [],
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

  it('shows one chip per tag and opens only the tapped tag over all time', () => {
    const trip = txn({ id: 'trip', type: 'expense', is_adjustment: 0, amount: -2000, baseAmount: 2000, tags: ['Lisbon', 'Work'] });
    const office = txn({ id: 'office', type: 'expense', is_adjustment: 0, amount: -9900, baseAmount: 9900, tags: ['Work'] });
    render(<DetailRows transaction={trip} />);
    expect(screen.getByText('Work')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('Lisbon'));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const seed = parseTransactionsRouteSeed(mockPush.mock.calls[0][0].params);
    expect(seed.periodSelection).toEqual({ mode: 'all' });
    expect(seed.filters.tags).toEqual(['Lisbon']);
    expect(summarizeTransactions(filterTransactions([trip, office], seed.filters))).toMatchObject({ count: 1, expense: 2000, net: -2000 });
  });

  it('shows no tags row without tags', () => {
    render(<DetailRows transaction={txn()} />);
    expect(screen.queryByText(translate('transactions.tags'))).toBeNull();
  });
});

import type { ImportProps } from './import';
import * as React from 'react';
import { translate } from '@/lib/i18n';
import { render, screen } from '@/lib/test-utils';
import { useImportTransactions } from './hooks';
import Import from './import';

jest.mock('./hooks', () => ({ useImportTransactions: jest.fn() }));

const state: ImportProps['state'] = {
  headers: ['date', 'amount'],
  allRows: [['date', 'amount'], ['2026-03-18', '-12.34']],
  mapping: { date: 0, amount: 1, currency: null, note: null, type: null, category: null, account: null, fallbackAmount: null, fallbackCurrency: null },
};

function mockHook(isInitializing: boolean) {
  jest.mocked(useImportTransactions).mockReturnValue({ isLoading: false, isInitializing, onImport: jest.fn(), markDuplicates: jest.fn() });
}

describe('import map step', () => {
  it('keeps Preview disabled until accounts and categories have loaded', () => {
    mockHook(true);
    const { rerender } = render(<Import state={state} setMapping={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText(translate('import-export.preview'))).toBeDisabled();

    mockHook(false);
    rerender(<Import state={state} setMapping={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText(translate('import-export.preview'))).toBeEnabled();
  });
});

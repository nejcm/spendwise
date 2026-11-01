import { Text } from 'react-native';
import { useAccounts } from '@/features/accounts/api';
import { useCategories } from '@/features/categories/api';
import { translate } from '@/lib/i18n';
import { cleanup, screen, setup } from '@/lib/test-utils';
import { FormDataGate } from './form-data-gate';

jest.mock('@/features/accounts/api', () => ({ useAccounts: jest.fn() }));
jest.mock('@/features/categories/api', () => ({ useCategories: jest.fn() }));

afterEach(cleanup);

const query = (overrides: object) => ({ data: undefined, isError: false, isFetching: false, refetch: jest.fn(), ...overrides });

function mockQueries(accounts: object, categories: object) {
  const a = query(accounts);
  const c = query(categories);
  jest.mocked(useAccounts).mockReturnValue(a as never);
  jest.mocked(useCategories).mockReturnValue(c as never);
  return { accounts: a, categories: c };
}

describe('formDataGate', () => {
  it('renders nothing while loading and the form once both lists have data', () => {
    mockQueries({}, { data: [] });
    const { rerender } = setup(<FormDataGate><Text>form</Text></FormDataGate>);
    expect(screen.queryByText('form')).toBeNull();

    mockQueries({ data: [] }, { data: [] });
    rerender(<FormDataGate><Text>form</Text></FormDataGate>);
    expect(screen.getByText('form')).toBeOnTheScreen();
  });

  it('shows a stable error state with retry and close instead of mounting the form', async () => {
    const { accounts, categories } = mockQueries({ isError: true }, { data: [] });
    const onClose = jest.fn();
    const { user } = setup(<FormDataGate onClose={onClose}><Text>form</Text></FormDataGate>);

    expect(screen.queryByText('form')).toBeNull();
    await user.press(screen.getByText(translate('common.retry')));
    expect(accounts.refetch).toHaveBeenCalledTimes(1);
    expect(categories.refetch).not.toHaveBeenCalled();

    await user.press(screen.getByText(translate('common.close')));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

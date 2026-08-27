import { View } from 'react-native';
import { translate } from '@/lib/i18n';
import { cleanup, render, screen, setup } from '@/lib/test-utils';
import { TransactionSelectionToolbar } from './transaction-selection-toolbar';

afterEach(cleanup);

/**
 * jest-expo stubs native measurement as a no-op, so the overflow menu's
 * `placement="above"` positioning callback never fires and the menu can't open.
 * Give it a real frame.
 */
function mockNativeMeasurement() {
  let probe: View | null = null;
  render(<View ref={(node) => void (probe = node)} />);
  // oxlint-disable-next-line no-unsafe-optional-chaining
  ((probe as View | null)?.measure as jest.Mock).mockImplementation(
    (callback: (...frame: [number, number, number, number, number, number]) => void) => callback(0, 0, 40, 40, 300, 700),
  );
}

describe('transaction selection toolbar', () => {
  it('shows the selected count and bulk action menu', () => {
    setup(
      <TransactionSelectionToolbar selectedCount={2} onClear={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(screen.getByText(translate('transactions.selected_count', { count: 2 }))).toBeOnTheScreen();
    expect(screen.getByLabelText(translate('settings.more'))).toBeOnTheScreen();
  });

  it('hides bulk actions when there are no selected transactions', () => {
    setup(
      <TransactionSelectionToolbar selectedCount={0} onClear={jest.fn()} onDelete={jest.fn()} />,
    );

    expect(screen.queryByLabelText(translate('settings.more'))).toBeNull();
  });

  it('clears the selection when the close button is pressed', async () => {
    const onClear = jest.fn();
    const { user } = setup(
      <TransactionSelectionToolbar selectedCount={2} onClear={onClear} onDelete={jest.fn()} />,
    );

    await user.press(screen.getByLabelText(translate('common.close')));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('deletes the selection from the bulk action menu', async () => {
    mockNativeMeasurement();
    const onDelete = jest.fn();
    const { user } = setup(
      <TransactionSelectionToolbar selectedCount={2} onClear={jest.fn()} onDelete={onDelete} />,
    );

    await user.press(screen.getByLabelText(translate('settings.more')));
    await user.press(await screen.findByText(translate('common.delete')));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

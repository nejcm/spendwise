import * as React from 'react';

import { cleanup, screen, setup } from '@/lib/test-utils';

import { ListRow } from './list-row';

afterEach(cleanup);

describe('listRow', () => {
  it('acts as one switch when `checked` is set', async () => {
    const onPress = jest.fn();
    const { user } = setup(<ListRow testID="row" title="Reminders" checked={false} onPress={onPress} />);
    const row = screen.getByTestId('row');
    expect(row.props.accessibilityRole).toBe('switch');
    expect(row.props.accessibilityState).toEqual({ checked: false });
    await user.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('forwards a row press to `focusInput`', async () => {
    const focus = jest.fn();
    const { user } = setup(<ListRow testID="row" title="When" chevron focusInput={{ current: { focus } }} />);
    await user.press(screen.getByTestId('row'));
    expect(focus).toHaveBeenCalledTimes(1);
  });
});

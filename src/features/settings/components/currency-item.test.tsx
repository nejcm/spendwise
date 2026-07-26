import type { OptionType } from '@/components/ui';
import * as React from 'react';
import { Alert } from '@/components/ui';
import { useChangeCurrency } from '@/features/currencies/hooks';
import { translate } from '@/lib/i18n';
import { cleanup, screen, setup } from '@/lib/test-utils';
import { CurrencyItem } from './currency-item';

jest.mock('@/components/ui', () => {
  const actual = jest.requireActual('@/components/ui');
  const MockPressable = actual.Pressable;
  const MockText = actual.Text;
  const MockView = actual.View;

  return {
    ...actual,
    Alert: { alert: jest.fn() },
    Euro: () => null,
    Options: ({ options, onSelect }: { options: OptionType[]; onSelect: (option: OptionType) => void }) => (
      <MockView>
        {options.filter((option) => option.value === 'EUR' || option.value === 'USD').map((option) => (
          <MockPressable key={option.value} testID={`currency-option-${option.value}`} onPress={() => onSelect(option)}>
            <MockText>{option.label}</MockText>
          </MockPressable>
        ))}
      </MockView>
    ),
    useModalSheet: jest.fn(() => ({
      ref: { current: null },
      present: jest.fn(),
      close: jest.fn(),
    })),
  };
});

jest.mock('@/features/currencies/hooks', () => ({
  useChangeCurrency: jest.fn(),
  useLastCurrencyRatesFetchedAt: jest.fn(() => ({ data: null })),
}));

jest.mock('@/lib/store/store', () => ({
  getAppState: jest.fn(() => ({ language: 'en' })),
  useAppStore: {
    use: {
      currency: jest.fn(() => 'EUR'),
      dateFormat: jest.fn(() => 'yyyy-MM-dd'),
    },
  },
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('currency item', () => {
  it('asks for confirmation before changing currency', async () => {
    const mutate = jest.fn();
    jest.mocked(useChangeCurrency).mockReturnValue({ mutate } as ReturnType<typeof useChangeCurrency>);
    const { user } = setup(<CurrencyItem />);

    await user.press(screen.getByTestId('currency-option-USD'));

    expect(Alert.alert).toHaveBeenCalledWith(
      translate('settings.changeCurrencyTitle'),
      translate('settings.changeCurrencyWarning'),
      expect.any(Array),
    );

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    buttons[0].onPress?.();
    expect(mutate).not.toHaveBeenCalled();

    buttons[1].onPress?.();
    expect(mutate).toHaveBeenCalledWith('USD');
  });

  it('does not ask for confirmation when the current currency is selected', async () => {
    const mutate = jest.fn();
    jest.mocked(useChangeCurrency).mockReturnValue({ mutate } as ReturnType<typeof useChangeCurrency>);
    const { user } = setup(<CurrencyItem />);

    await user.press(screen.getByTestId('currency-option-EUR'));

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });
});

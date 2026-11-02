import { categoryTiles, deriveFxRate, fxRateText, savedSnackbar, transactionFooterText } from './helpers';

const format = { numberFormat: 'stop-space', currencyFormat: 'symbol-before' } as const;

describe('deriveFxRate / fxRateText', () => {
  const spotify = { amount: -1299, baseAmount: 1099, currency: 'USD', baseCurrency: 'EUR' } as const;

  it('derives the rate from the stored amounts, ignoring sign', () => {
    expect(deriveFxRate(spotify)).toBeCloseTo(0.846, 4);
    expect(fxRateText(spotify, format)).toBe('$1 = €0.846');
  });

  it('has no rate when nothing was converted', () => {
    expect(deriveFxRate({ ...spotify, currency: 'EUR' })).toBeNull();
    expect(deriveFxRate({ ...spotify, amount: 0 })).toBeNull();
    expect(fxRateText({ ...spotify, currency: 'EUR' }, format)).toBeNull();
  });
});

describe('transactionFooterText', () => {
  const created = Math.floor(new Date(2026, 9, 26, 20, 43).getTime() / 1000);

  it('says never edited when updated_at did not move', () => {
    expect(transactionFooterText({ created_at: created, updated_at: created }, false)).toBe('Added Oct 26, 20:43 · never edited');
  });

  it('shows the edit time once the row was updated', () => {
    const edited = Math.floor(new Date(2026, 9, 27, 9, 5).getTime() / 1000);
    expect(transactionFooterText({ created_at: created, updated_at: edited }, false)).toBe('Added Oct 26, 20:43 · edited Oct 27, 09:05');
  });

  it('credits the recurring rule for generated rows', () => {
    expect(transactionFooterText({ created_at: created, updated_at: created }, true)).toBe('Added by recurring rule · Oct 26, 20:43');
  });
});

describe('categoryTiles', () => {
  const cats = ['a', 'b', 'c', 'd'].map((id) => ({ id }));

  it('keeps the order when the selection is already visible', () => {
    expect(categoryTiles(cats, 'b', 3).map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(categoryTiles(cats, '', 3).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('moves a selection from further down to the front', () => {
    expect(categoryTiles(cats, 'd', 3).map((c) => c.id)).toEqual(['d', 'a', 'b']);
  });
});

describe('savedSnackbar', () => {
  it('titles by type and signs the amount', () => {
    const noop = () => {};
    const base = { currency: 'EUR', format, onUndo: noop, onView: noop } as const;
    expect(savedSnackbar({ ...base, type: 'expense', amount: '42.50', label: 'Eating out' }))
      .toMatchObject({ title: 'Expense saved', subtitle: '-€42.50 · Eating out' });
    expect(savedSnackbar({ ...base, type: 'income', amount: '10' }).subtitle).toBe('+€10');
    expect(savedSnackbar({ ...base, type: 'transfer', amount: '500', label: 'To Savings' }).subtitle).toBe('€500 · To Savings');
  });

  it('undo deletes what was created', () => {
    const onUndo = jest.fn();
    savedSnackbar({ type: 'expense', amount: '1', currency: 'EUR', format, onUndo, onView: jest.fn() }).undo();
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});

import { autoDetectColumnMapping, mapRows, parseCSV } from '@/features/imports-export/csv-parser';

describe('parseCSV', () => {
  it('keeps quoted multiline fields in the same row', () => {
    const rows = parseCSV('date,note,amount,type\n2026-03-18,"Lunch\nwith team",12.34,expense');

    expect(rows).toEqual([
      ['date', 'note', 'amount', 'type'],
      ['2026-03-18', 'Lunch\nwith team', '12.34', 'expense'],
    ]);
  });
});

describe('mapRows', () => {
  it('preserves transfer rows from CSV type column', () => {
    const rows = mapRows(
      [
        ['date', 'amount', 'type', 'note'],
        ['2026-03-18', '50.00', 'transfer', 'Move to savings'],
      ],
      { date: 0, amount: 1, type: 2, note: 3, currency: null, category: null, account: null, fallbackAmount: null, fallbackCurrency: null },
      true,
    );

    expect(rows).toEqual(
      { rows: [{ amount: 5000, currency: 'USD', date: '2026-03-18', note: 'Move to savings', type: 'transfer' }], skipped: [] },
    );
  });

  it('maps currency and category columns', () => {
    const rows = mapRows(
      [
        ['DATE', 'TYPE', 'FROM ACCOUNT', 'TO ACCOUNT/TO CATEGORY', 'AMOUNT', 'CURRENCY', 'AMOUNT 2', 'CURRENCY 2', 'TAGS', 'NOTES'],
        ['3/18/26', 'Expense', 'USD', 'Bills', '4.7', 'USD', '21', 'MYR', '', 'Youtube'],
      ],
      { date: 0, type: 1, amount: 4, currency: 5, note: 9, category: 3, account: null, fallbackAmount: null, fallbackCurrency: null },
      true,
    );

    expect(rows).toEqual(
      { rows: [{ amount: -470, categoryName: 'Bills', currency: 'USD', date: '2026-03-18', note: 'Youtube', type: 'expense' }], skipped: [] },
    );
  });

  it('uses fallback amount and currency when row currency is unsupported', () => {
    const result = mapRows(
      [
        ['DATE', 'AMOUNT', 'CURRENCY', 'AMOUNT_EUR', 'CURRENCY_2', 'NOTES'],
        ['2026-03-18', '4.7', 'XYZ', '21', 'EUR', 'Youtube'],
      ],
      { date: 0, amount: 1, currency: 2, note: 5, type: null, category: null, account: null, fallbackAmount: 3, fallbackCurrency: 4 },
      true,
    );

    expect(result.skipped).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ amount: 2100, currency: 'EUR', usedFallback: true });
  });

  it('skips row when currency is unsupported and no fallback is configured', () => {
    const result = mapRows(
      [
        ['DATE', 'AMOUNT', 'CURRENCY', 'NOTES'],
        ['2026-03-18', '4.7', 'XYZ', 'Youtube'],
      ],
      { date: 0, amount: 1, currency: 2, note: 3, type: null, category: null, account: null, fallbackAmount: null, fallbackCurrency: null },
      true,
    );

    expect(result.rows).toHaveLength(0);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.rawCurrency).toBe('XYZ');
  });
});

describe('autoDetectColumnMapping', () => {
  it('detects currency and category columns', () => {
    const rows = [
      ['DATE', 'TYPE', 'FROM ACCOUNT', 'TO ACCOUNT/TO CATEGORY', 'AMOUNT', 'CURRENCY', 'AMOUNT 2', 'CURRENCY 2', 'TAGS', 'NOTES'],
      ['3/18/26', 'Expense', 'USD', 'Bills', '4.7', 'USD', '21', 'MYR', '', 'Youtube'],
    ];

    const mapping = autoDetectColumnMapping(rows);

    expect(mapping.date).toBe(0);
    expect(mapping.type).toBe(1);
    expect(mapping.category).toBe(3);
    expect(mapping.amount).toBe(4);
    expect(mapping.currency).toBe(5);
    expect(mapping.note).toBe(9);
  });
});

/***
 * Example CSV:

"DATE","TYPE","FROM ACCOUNT","TO ACCOUNT/TO CATEGORY","AMOUNT","CURRENCY","AMOUNT 2","CURRENCY 2","TAGS","NOTES"
"3/19/26","Expense","USD","Other","7","USD","7","USD","","Spotify"
"3/18/26","Expense","USD","Bills","4.7","USD","21","MYR","","Youtube"
"2/16/26","Expense","USD","Rent","933.75","USD","4200","MYR","","Rent"

 */

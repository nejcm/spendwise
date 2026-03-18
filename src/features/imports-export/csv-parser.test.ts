import { mapRows, parseCSV } from '@/features/imports-export/csv-parser';

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
      { date: 0, amount: 1, type: 2, note: 3, currency: null },
      true,
    );

    expect(rows).toEqual([
      {
        date: '2026-03-18',
        amount: 5000,
        note: 'Move to savings',
        type: 'transfer',
      },
    ]);
  });
});

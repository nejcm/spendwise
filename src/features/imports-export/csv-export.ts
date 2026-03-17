export type ExportTransactionRow = {
  id: string;
  account_id: string;
  category_id: string | null;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
  account_name: string | null;
  account_type: string | null;
  account_currency: string | null;
  account_icon: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
};

const CSV_HEADERS = [
  'id',
  'date',
  'type',
  'amount',
  'currency',
  'note',
  'account_id',
  'account_name',
  'account_type',
  'account_currency',
  'account_icon',
  'category_id',
  'category_name',
  'category_icon',
  'category_color',
  'created_at',
  'updated_at',
] as const;

export function formatTransactionsCsv(transactions: ExportTransactionRow[]): string {
  const rows = transactions.map((transaction) => {
    const cells = [
      transaction.id,
      transaction.date,
      transaction.type,
      formatAmountForCsv(transaction.amount),
      transaction.currency,
      transaction.note,
      transaction.account_id,
      transaction.account_name,
      transaction.account_type,
      transaction.account_currency,
      transaction.account_icon,
      transaction.category_id,
      transaction.category_name,
      transaction.category_icon,
      transaction.category_color,
      transaction.created_at,
      transaction.updated_at,
    ];

    return cells.map((cell) => escapeCsvCell(cell ?? '')).join(',');
  });

  return [CSV_HEADERS.join(','), ...rows].join('\n');
}

function formatAmountForCsv(amountInCents: number): string {
  return (amountInCents / 100).toFixed(2);
}

const RE_CSV_ESCAPE = /[",\n\r]/;
function escapeCsvCell(value: string): string {
  if (!RE_CSV_ESCAPE.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

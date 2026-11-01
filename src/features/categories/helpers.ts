import type { Category } from './types';
import type { TransactionType } from '@/features/transactions/types';
import { DEFAULT_CATEGORY_ID } from '@/config';

export function fitsTransactionType(category: Pick<Category, 'id' | 'kind'>, type: TransactionType): boolean {
  return type === 'transfer' || category.id === DEFAULT_CATEGORY_ID || category.kind === type;
}

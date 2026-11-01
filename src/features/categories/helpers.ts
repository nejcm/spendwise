import type { Category } from './types';
import type { TransactionType } from '@/features/transactions/types';
import { DEFAULT_CATEGORY_ID } from '@/config';

export function fitsTransactionType(category: Pick<Category, 'id' | 'kind'>, type: TransactionType): boolean {
  return type === 'transfer' || category.id === DEFAULT_CATEGORY_ID || category.kind === type;
}

/** Starting values whose category contradicts the type: a given type drops the category, otherwise the type follows the category. */
export function fitCategoryToType<T extends { type: TransactionType; category_id: string | null }>(
  values: T,
  categories: Pick<Category, 'id' | 'kind'>[],
  given: { type: boolean; category: boolean },
): T {
  const category = categories.find((c) => c.id === values.category_id);
  if (!category) return values;
  // A category the caller picked rules out a remembered transfer type.
  const fits = fitsTransactionType(category, values.type) && !(given.category && values.type === 'transfer');
  if (fits) return values;
  return given.type ? { ...values, category_id: '' } : { ...values, type: category.kind };
}

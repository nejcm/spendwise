import type { CategoryFormData } from './types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';

import Alert from '@/components/ui/alert';
import { captureError } from '@/lib/analytics';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import { translate } from '@/lib/i18n';

import * as queries from './queries';

export function useCategories(_type?: 'income' | 'expense') {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => queries.getCategories(db),
  });
}

function onError(error: unknown) {
  if (error instanceof Error) captureError(error, { context: 'categories' });
  Alert.alert(translate('common.error'), error instanceof Error ? error.message : translate('common.error_description'));
}

export function useCreateCategory(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormData) => queries.createCategory(db, data),
    onSuccess: () => {
      invalidateFor(queryClient, 'category');
      onSuccess?.();
    },
    onError,
  });
}

export function useUpdateCategory(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; data: Pick<CategoryFormData, 'name' | 'icon' | 'color' | 'sort_order'> }) =>
      queries.updateCategory(db, params.id, params.data),
    onSuccess: () => {
      invalidateFor(queryClient, 'category');
      onSuccess?.();
    },
    onError,
  });
}

export function useDeleteCategory(onSuccess?: () => void) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => queries.deleteCategory(db, id),
    onSuccess: () => {
      onSuccess?.();
      invalidateFor(queryClient, 'category');
    },
    onError,
  });
}

export function useUpdateCategoryOrder() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Array<{ id: string; sort_order: number }>) =>
      queries.updateCategoryOrder(db, items),
    onSuccess: () => {
      invalidateFor(queryClient, 'category');
    },
    onError,
  });
}

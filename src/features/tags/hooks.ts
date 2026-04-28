import type { TagFormData } from './types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSQLiteContext } from 'expo-sqlite';
import { invalidateFor } from '@/lib/data/invalidation';
import { queryKeys } from '@/lib/data/query-keys';
import {
  createTag,
  deleteTag,
  getTags,
  getTagsForTransaction,
  getTransactionIdsForTag,
  setTransactionTags,
  updateTag,
} from './queries';

export function useTags() {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.tags.all,
    queryFn: () => getTags(db),
  });
}

export function useCreateTag() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagFormData) => createTag(db, data),
    onSuccess: () => {
      invalidateFor(queryClient, 'tag');
    },
  });
}

export function useUpdateTag() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TagFormData }) => updateTag(db, id, data),
    onSuccess: () => {
      invalidateFor(queryClient, 'tag');
    },
  });
}

export function useDeleteTag() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTag(db, id),
    onSuccess: () => {
      invalidateFor(queryClient, 'tag');
    },
  });
}

export function useTagsForTransaction(transactionId: string | undefined) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.tags.forTransaction(transactionId ?? ''),
    enabled: !!transactionId,
    queryFn: () => getTagsForTransaction(db, transactionId!),
  });
}

export function useTransactionIdsForTag(tagId: string | null) {
  const db = useSQLiteContext();
  return useQuery({
    queryKey: queryKeys.tags.transactionIds(tagId ?? ''),
    enabled: !!tagId,
    queryFn: () => getTransactionIdsForTag(db, tagId!),
  });
}

export function useSetTransactionTags() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, tagIds }: { transactionId: string; tagIds: string[] }) =>
      setTransactionTags(db, transactionId, tagIds),
    onSuccess: () => {
      invalidateFor(queryClient, 'tag');
    },
  });
}

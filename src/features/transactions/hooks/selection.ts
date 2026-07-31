import * as React from 'react';
import { useMemo, useState } from 'react';
import { Alert } from '@/components/ui';
import { translate } from '@/lib/i18n';
import { useDeleteTransactions } from './api';

type SelectableTransaction = { id: string };

/**
 * Bulk selection state for a transaction list: long-press to start, tap to
 * toggle, confirm before deleting. Selected ids are always narrowed to the
 * transactions passed in, so ids that drop out of the list (e.g. after a
 * period change) are never counted or deleted.
 */
export function useTransactionSelection(transactions: readonly SelectableTransaction[]) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const deleteTransactions = useDeleteTransactions(clearSelection);

  const toggleSelection = React.useCallback((id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startSelection = React.useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const currentTransactionIds = useMemo(() => new Set(transactions.map((transaction) => transaction.id)), [transactions]);
  const currentSelectedIds = useMemo(
    () => [...selectedIds].filter((id) => currentTransactionIds.has(id)),
    [currentTransactionIds, selectedIds],
  );
  const selectedCount = currentSelectedIds.length;

  const deleteSelected = React.useCallback(() => {
    if (selectedCount === 0) return;
    Alert.alert(
      translate('common.delete'),
      translate('transactions.delete_selected_confirmation', { count: selectedCount }),
      [
        { text: translate('common.cancel'), style: 'cancel' },
        {
          text: translate('common.delete'),
          style: 'destructive',
          onPress: () => deleteTransactions.mutate(currentSelectedIds),
        },
      ],
    );
  }, [currentSelectedIds, deleteTransactions, selectedCount]);

  return {
    selectionMode,
    selectedIds,
    selectedCount,
    toggleSelection,
    startSelection,
    clearSelection,
    deleteSelected,
  };
}

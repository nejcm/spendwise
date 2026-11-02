import type { TransactionWithCategory } from './types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView } from 'react-native';
import { HeaderButton, PageHeader } from '@/components/page-header';
import { Copy, FocusAwareStatusBar, GhostButton, RepeatIcon, Text, View } from '@/components/ui';
import { ChevronLeft, Pencil } from '@/components/ui/icon';
import { NAV_BAR_HEIGHT } from '@/components/ui/nav-tab-bar';
import { useRuleForTransaction } from '@/features/scheduled-transactions/hooks';
import { unixToISODate } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { goBackOrFallback } from '@/lib/routing';
import { centsToAmount } from '../formatting/helpers';
import { useCreateTransaction, useDeleteTransactionWithUndo, useDuplicateTransfer, useTransaction } from './api';
import { DetailAction, DetailHero, DetailRows, FxNote } from './components/transaction-detail-parts';
import { TransactionForm } from './components/transaction-form';
import { transactionToFormValues } from './components/transaction-form-schema';
import { transactionFooterText } from './helpers';

function Wash() {
  return <View pointerEvents="none" className="absolute inset-x-0 top-0 h-85 bg-linear-to-b from-wash to-background" />;
}

function useTransactionActions(transaction: TransactionWithCategory | null | undefined) {
  const router = useRouter();
  const createMut = useCreateTransaction();
  const duplicateTransferMut = useDuplicateTransfer();
  const deleteMut = useDeleteTransactionWithUndo();
  const deletingRef = React.useRef(false);

  const remove = () => {
    if (!transaction || deletingRef.current) return;
    deletingRef.current = true;
    deleteMut.mutate(transaction.id, {
      onSuccess: () => goBackOrFallback(router),
      onSettled: () => { deletingRef.current = false; },
    });
  };

  const makeRecurring = () => {
    if (!transaction || transaction.type === 'transfer') return;
    router.push({
      pathname: '/scheduled/new',
      params: {
        type: transaction.type,
        currency: transaction.currency,
        amount: centsToAmount(transaction.amount),
        category_id: transaction.category_id,
        account_id: transaction.account_id,
        note: transaction.note,
        start_date: unixToISODate(transaction.date),
        source_transaction_id: transaction.id,
      },
    });
  };

  const duplicate = () => {
    if (!transaction) return;
    const onSuccess = (duplicateId: string) => router.replace({ pathname: '/transactions/[id]', params: { id: duplicateId } });
    if (transaction.transfer_id) {
      duplicateTransferMut.mutate(transaction.transfer_id, { onSuccess });
      return;
    }
    createMut.mutate({
      account_id: transaction.account_id,
      category_id: transaction.category_id,
      type: transaction.type,
      amount: centsToAmount(transaction.amount),
      baseAmount: centsToAmount(transaction.baseAmount),
      currency: transaction.currency,
      date: transaction.date,
      note: transaction.note,
      merchant_name: transaction.merchant_name,
      location: transaction.location,
    }, { onSuccess });
  };

  return { remove, makeRecurring, duplicate };
}

export function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: transaction, isLoading } = useTransaction(id ?? '');
  const { data: rule } = useRuleForTransaction(id ?? '');
  const actions = useTransactionActions(transaction);
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing && transaction) {
    return (
      <View className="flex-1 bg-background">
        <FocusAwareStatusBar />
        <Wash />
        <TransactionForm
          initialValues={transactionToFormValues(transaction)}
          isAdjustment={!!transaction.is_adjustment}
          onSaved={() => setIsEditing(false)}
          onClose={() => setIsEditing(false)}
          bottomMenuOffset={NAV_BAR_HEIGHT}
        />
      </View>
    );
  }

  const isAdjustment = !!transaction?.is_adjustment;
  const isForeign = !!transaction && transaction.currency !== transaction.baseCurrency;
  const canDuplicate = !isAdjustment;
  const canMakeRecurring = !isAdjustment && transaction?.type !== 'transfer' && !rule;
  const edit = () => setIsEditing(true);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar />
      <Wash />
      <View className="px-5 pt-2">
        <PageHeader
          left={<HeaderButton icon={ChevronLeft} label={translate('common.back')} onPress={() => goBackOrFallback(router)} />}
          right={transaction && <HeaderButton icon={Pencil} label={translate('common.edit')} onPress={edit} />}
        >
          <Text className="min-w-0 flex-1 text-center text-[15px] text-muted-foreground" numberOfLines={1}>
            {transaction && translate(isAdjustment ? 'accounts.opening_balance' : `transactions.${transaction.type}`)}
          </Text>
        </PageHeader>
      </View>
      {isLoading || !transaction
        ? (
            <View className="flex-1 items-center justify-center">
              <Text>{translate('common.loading')}</Text>
            </View>
          )
        : (
            <ScrollView className="flex-1" contentContainerClassName="pb-6">
              <DetailHero transaction={transaction} onAmountPress={isForeign ? edit : undefined} />
              <DetailRows transaction={transaction} rule={rule} />
              {isForeign && <FxNote />}
              {(canDuplicate || canMakeRecurring) && (
                <View className="mx-5 mt-3 flex-row gap-2.5">
                  {canDuplicate && <DetailAction icon={Copy} label={translate('transactions.duplicate')} onPress={actions.duplicate} />}
                  {canMakeRecurring && <DetailAction icon={RepeatIcon} label={translate('transactions.make_recurring')} onPress={actions.makeRecurring} />}
                </View>
              )}
              <GhostButton color="danger" className="mt-4" textClassName="text-[15px] font-medium" label={translate('transactions.detail.delete')} onPress={actions.remove} />
              <Text className="pt-2 text-center text-xs text-muted-foreground">{transactionFooterText(transaction, !!rule?.generated)}</Text>
            </ScrollView>
          )}
    </View>
  );
}

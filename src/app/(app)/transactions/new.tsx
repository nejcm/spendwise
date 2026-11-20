import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { parseTransactionFormInitialValues } from '@/features/transactions/form-route-params';
import { goBackOrFallback, singleValueParams } from '@/lib/routing';
import { useAppStore } from '@/lib/store/store';

export default function NewTransactionRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const openTxOnCreate = useAppStore.use.openTxOnCreate();
  const initialValues = React.useMemo(() => parseTransactionFormInitialValues(params), [params]);
  const paramsKey = JSON.stringify(params);
  const mountedParamsKeyRef = React.useRef(paramsKey);

  // A deep link to the open form only swaps its params; open a fresh form on top so this draft stays intact.
  React.useEffect(() => {
    if (paramsKey === mountedParamsKeyRef.current) return;
    mountedParamsKeyRef.current = paramsKey;
    router.push({ pathname: '/transactions/new', params: singleValueParams(params) });
  }, [params, paramsKey, router]);
  const onClose = () => goBackOrFallback(router);

  return (
    <View className="flex-1 bg-background">
      <View pointerEvents="none" className="absolute inset-x-0 top-0 h-85 bg-linear-to-b from-wash to-background" />
      <TransactionForm
        initialValues={initialValues}
        onClose={onClose}
        onSaved={(transactionId, addAnother) => {
          if (addAnother) return;
          if (openTxOnCreate) router.replace(`/transactions/${transactionId}`);
          else onClose();
        }}
      />
    </View>
  );
}

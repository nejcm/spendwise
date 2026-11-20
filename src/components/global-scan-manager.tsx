import type { Action } from 'expo-image-manipulator';
import type { IncomingShare, SharedItem } from '@/features/ai/share-intent';
import type { ScannedReceipt, ScanVariables } from '@/features/ai/use-scan-receipt';
import type { TransactionFormData } from '@/features/transactions/types';
import type { ScanTriggeredType } from '@/lib/store/local-store';
import { useMutation } from '@tanstack/react-query';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback } from 'react';
import { AppState, Image as RNImage } from 'react-native';
import { Alert } from '@/components/ui';
import { useAccounts } from '@/features/accounts/api';
import { toNote, useIncomingShare } from '@/features/ai/share-intent';
import { useScanReceipt } from '@/features/ai/use-scan-receipt';
import { useCategories } from '@/features/categories/api';
import { firstFittingCategoryId } from '@/features/categories/helpers';
import { centsToAmount } from '@/features/formatting/helpers';
import { useCreateTransaction } from '@/features/transactions/api';
import { dateToUnix } from '@/lib/date/helpers';
import { translate } from '@/lib/i18n';
import { closeScan, useLocalStore } from '@/lib/store/local-store';
import {
  selectIsAiEnabled,
  selectIsAiFeatureOn,
  selectTransactionFormPrefs,
  useAppStore,
} from '@/lib/store/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { ActivityIndicator, GhostButton, Image, Modal, SolidButton, Text, View } from './ui';

const MAX_IMAGE_DIMENSION = 1024;

type ScanSourceImage = { uri: string; width: number | null; height: number | null };

async function resizeForAI(source: ScanSourceImage): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  const { width, height } = source.width && source.height ? { width: source.width, height: source.height } : await RNImage.getSize(source.uri);
  const actions: Action[] = Math.max(width, height) > MAX_IMAGE_DIMENSION
    ? [{ resize: width >= height ? { width: MAX_IMAGE_DIMENSION } : { height: MAX_IMAGE_DIMENSION } }]
    : [];

  const context = ImageManipulator.manipulate(source.uri);
  for (const action of actions) {
    if ('resize' in action) context.resize(action.resize);
    else if ('rotate' in action) context.rotate(action.rotate);
    else if ('flip' in action) context.flip(action.flip);
    else if ('crop' in action) context.crop(action.crop);
    else if ('extent' in action && context.extent) context.extent(action.extent);
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.85, format: SaveFormat.JPEG, base64: true });
  context.release();
  image.release();

  return { base64: result.base64!, mimeType: 'image/jpeg' };
}

function subscribeToAppState(onChange: () => void) {
  const subscription = AppState.addEventListener('change', onChange);
  return () => subscription.remove();
}

function ScanLoadingOverlay({ onClose }: { onClose: () => void }) {
  const { dark } = useThemeConfig();

  return (
    <Modal visible={true} className="gap-4 py-10" onClose={onClose}>
      <ActivityIndicator size="large" color={dark ? '#ffffff' : '#000000'} />
      <Text className="text-base font-medium">{translate('scan.analyzing')}</Text>
    </Modal>
  );
}

type SharedItemSheetProps = {
  item: SharedItem;
  canScan: boolean;
  onScan: () => void;
  onFillManually: () => void;
  onDiscard: () => void;
};

function SharedItemSheet({ item, canScan, onScan, onFillManually, onDiscard }: SharedItemSheetProps) {
  return (
    <Modal visible={true} className="w-11/12 gap-4 pt-12" onClose={onDiscard}>
      <Text accessibilityRole="header" className="self-start text-xl font-bold">{translate('scan.share_title')}</Text>
      {item.kind === 'image'
        ? <Image source={{ uri: item.uri }} contentFit="contain" className="h-48 w-full rounded-lg" accessibilityIgnoresInvertColors />
        : <Text numberOfLines={6} className="self-start text-base">{item.text}</Text>}
      <View className="w-full gap-2">
        {canScan && <SolidButton color="primary" size="lg" fullWidth label={translate('scan.share_scan')} onPress={onScan} />}
        <SolidButton color="tonal" size="lg" fullWidth label={translate('scan.share_manual')} onPress={onFillManually} />
        <GhostButton color="secondary" size="lg" fullWidth label={translate('scan.share_discard')} onPress={onDiscard} />
      </View>
    </Modal>
  );
}

export function GlobalScanManager() {
  const router = useRouter();
  const pathname = usePathname();
  const isTransactionFormRoute = pathname === '/transactions/new';
  const isAiEnabled = useAppStore(selectIsAiEnabled);
  const isScanOn = useAppStore(selectIsAiFeatureOn('scan'));
  const isLocked = useAppStore((state) => state.lockEnabled && state.isLocked);
  const isFirstTime = useAppStore.use.isFirstTime();
  const scanTriggered = useLocalStore.use.scanTriggered();
  const saveOnScan = useAppStore.use.saveOnScan();
  const preferredCurrency = useAppStore.use.currency();
  const transactionFormPrefs = useAppStore(selectTransactionFormPrefs);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();
  const { share, errorId, clearShare } = useIncomingShare();
  const appState = React.useSyncExternalStore(subscribeToAppState, () => AppState.currentState);
  const alertedErrorIdRef = React.useRef(0);
  const activeScanRef = React.useRef<{ variables: ScanVariables; shareId: number | null } | null>(null);
  // Claimed synchronously by the first action, before React re-renders the sheet.
  const claimedShareIdRef = React.useRef<number | null>(null);
  const claimShare = (id: number) => {
    if (claimedShareIdRef.current === id) return false;
    claimedShareIdRef.current = id;
    return true;
  };
  const releaseShare = (id: number | null) => {
    if (claimedShareIdRef.current === id) claimedShareIdRef.current = null;
  };

  const handleScanSuccess = async (result: ScannedReceipt, variables: ScanVariables) => {
    const scan = activeScanRef.current;
    // A dismissed or superseded scan must not save; a share must produce at most one transaction.
    if (scan?.variables !== variables) return;
    activeScanRef.current = null;
    const finishShare = () => {
      if (scan.shareId !== null) clearShare(scan.shareId);
    };
    const accountId = transactionFormPrefs.account_id || accounts[0]?.id;
    const categoryId = firstFittingCategoryId([result.category_id, transactionFormPrefs.category_id, categories[0]?.id], categories, result.type);
    if (!saveOnScan || !accountId || !categoryId) {
      const nextRoute = {
        pathname: '/transactions/new',
        params: {
          ...result,
          amount: centsToAmount(result.amount),
        },
      } as const;
      finishShare();
      if (isTransactionFormRoute) router.replace(nextRoute);
      else router.push(nextRoute);
      return;
    }
    const data: TransactionFormData = {
      type: result.type,
      currency: result.currency ?? preferredCurrency,
      amount: centsToAmount(result.amount),
      note: result.note,
      merchant_name: result.merchant_name,
      location: result.location,
      account_id: accountId,
      category_id: categoryId,
      date: dateToUnix(result.date),
    };
    const id = await createTransaction.mutateAsync(data);
    finishShare();
    if (isTransactionFormRoute) router.replace(`/transactions/${id}`);
    else router.push(`/transactions/${id}`);
  };
  const scanMutation = useScanReceipt(handleScanSuccess);
  const { mutate: mutateScan } = scanMutation;
  const startScan = (variables: ScanVariables, shareId: number | null) => {
    activeScanRef.current = { variables, shareId };
    mutateScan(variables, { onSettled: () => releaseShare(shareId) });
  };

  const prepareMutation = useMutation({
    mutationFn: async ({ image }: { image: ScanSourceImage; shareId: number | null }): Promise<ScanVariables> => {
      const { base64, mimeType } = await resizeForAI(image);
      return { base64Image: base64, mimeType };
    },
    onSuccess: (variables, { shareId }) => startScan(variables, shareId),
    onError: (error) => {
      const message = error instanceof Error ? error.message : translate('scan.error_generic');
      Alert.alert(translate('common.error'), message);
    },
  });
  const { mutate: mutatePrepare } = prepareMutation;

  const pickAndPrepare = useCallback(async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(translate('common.error'), translate('scan.camera_permission_denied'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (asset) mutatePrepare({ image: asset, shareId: null });
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(translate('common.error'), translate('scan.gallery_permission_denied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset) mutatePrepare({ image: asset, shareId: null });
  }, [mutatePrepare]);

  const handleTrigger = useCallback((type: ScanTriggeredType) => {
    if (!isScanOn) {
      Alert.alert(
        translate(isAiEnabled ? 'scan.off_title' : 'scan.no_key_title'),
        translate(isAiEnabled ? 'scan.off_message' : 'scan.no_key_message'),
        [
          { text: translate('common.cancel'), style: 'cancel' },
          { text: translate('scan.go_to_settings'), onPress: () => router.push('/settings/ai') },
        ],
      );
      return;
    }
    if (type !== 'select') {
      void pickAndPrepare(type);
      return;
    }
    Alert.alert(
      translate('scan.source_title'),
      undefined,
      [
        { text: translate('scan.source_camera'), onPress: () => void pickAndPrepare('camera') },
        { text: translate('scan.source_gallery'), onPress: () => void pickAndPrepare('gallery') },
        { text: translate('common.cancel'), style: 'cancel' },
      ],
    );
  }, [isAiEnabled, isScanOn, router, pickAndPrepare]);

  React.useEffect(() => {
    if (!scanTriggered) return;
    closeScan();
    void handleTrigger(scanTriggered);
  }, [scanTriggered, handleTrigger]);

  const isShareReady = appState === 'active' && !isLocked && !isFirstTime;
  React.useEffect(() => {
    if (errorId === alertedErrorIdRef.current || !isShareReady) return;
    alertedErrorIdRef.current = errorId;
    Alert.alert(translate('common.error'), translate('scan.share_error'));
  }, [errorId, isShareReady]);

  const canShowSheet = Boolean(share) && !isLocked && !isFirstTime && !scanMutation.isPending && !prepareMutation.isPending;
  const [wasSheetVisible, setWasSheetVisible] = React.useState(false);
  // iOS goes 'inactive' over an open sheet for Control Center or Face ID; a new sheet still waits for 'active'.
  const isSheetVisible = canShowSheet && (appState === 'active' || (appState === 'inactive' && wasSheetVisible));
  if (isSheetVisible !== wasSheetVisible) setWasSheetVisible(isSheetVisible);

  const scanShare = ({ id, item }: IncomingShare) => {
    if (!claimShare(id)) return;
    if (item.kind === 'image') mutatePrepare({ image: item, shareId: id }, { onError: () => releaseShare(id) });
    else startScan({ text: item.text }, id);
  };
  const fillShareManually = ({ id, item }: IncomingShare) => {
    if (!claimShare(id)) return;
    clearShare(id);
    // Pushed, not replaced, so an unsaved form underneath survives.
    router.push({ pathname: '/transactions/new', params: { note: item.kind === 'text' ? toNote(item.text) : undefined } });
  };
  const discardShare = ({ id }: IncomingShare) => {
    if (claimShare(id)) clearShare(id);
  };

  const dismissScan = () => {
    // Once a result is being saved the scan can no longer be dismissed.
    const scan = activeScanRef.current;
    if (!scan) return;
    activeScanRef.current = null;
    releaseShare(scan.shareId);
    scanMutation.reset();
  };

  if (scanMutation.isPending) return <ScanLoadingOverlay onClose={dismissScan} />;
  if (!share || !isSheetVisible) return null;
  return (
    <SharedItemSheet
      item={share.item}
      canScan={isScanOn}
      onScan={() => scanShare(share)}
      onFillManually={() => fillShareManually(share)}
      onDiscard={() => discardShare(share)}
    />
  );
}

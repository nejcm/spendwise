import type { Action } from 'expo-image-manipulator';
import type { ScannedReceipt, ScanVariables } from '@/features/ai/use-scan-receipt';
import type { TransactionFormData } from '@/features/transactions/types';
import type { ScanTriggeredType } from '@/lib/store/local-store';
import { useMutation } from '@tanstack/react-query';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { usePathname, useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import * as React from 'react';
import { useCallback } from 'react';
import { Image } from 'react-native';
import { Alert } from '@/components/ui';
import { useAccounts } from '@/features/accounts/api';
import { resolveShareAction } from '@/features/ai/share-intent';
import { useScanReceipt } from '@/features/ai/use-scan-receipt';
import { useCategories } from '@/features/categories/api';
import { firstFittingCategoryId } from '@/features/categories/helpers';
import { centsToAmount } from '@/features/formatting/helpers';
import { useCreateTransaction } from '@/features/transactions/api';
import { IS_WEB } from '@/lib/base';
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
import { ActivityIndicator, Modal, Text } from './ui';

const MAX_IMAGE_DIMENSION = 1024;
// Kept until handled so a Face ID prompt (inactive state) can't drop a share waiting behind the app lock.
const SHARE_INTENT_OPTIONS = { resetOnBackground: false, disabled: IS_WEB };

type ScanSourceImage = { uri: string; width: number | null; height: number | null };

async function resizeForAI(source: ScanSourceImage): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  const { width, height } = source.width && source.height ? { width: source.width, height: source.height } : await Image.getSize(source.uri);
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

function showScanOffAlert(isAiEnabled: boolean, onGoToSettings: () => void) {
  Alert.alert(
    translate(isAiEnabled ? 'scan.off_title' : 'scan.no_key_title'),
    translate(isAiEnabled ? 'scan.off_message' : 'scan.no_key_message'),
    [
      { text: translate('common.cancel'), style: 'cancel' },
      { text: translate('scan.go_to_settings'), onPress: onGoToSettings },
    ],
  );
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
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent(SHARE_INTENT_OPTIONS);

  const handleScanSuccess = async (result: ScannedReceipt) => {
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
    if (isTransactionFormRoute) router.replace(`/transactions/${id}`);
    else router.push(`/transactions/${id}`);
  };
  const scanMutation = useScanReceipt(handleScanSuccess);

  const prepareMutation = useMutation({
    mutationFn: async (image: ScanSourceImage): Promise<ScanVariables> => {
      const { base64, mimeType } = await resizeForAI(image);
      return { base64Image: base64, mimeType };
    },
    onSuccess: (variables) => {
      scanMutation.mutate(variables);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : translate('scan.error_generic');
      Alert.alert(translate('common.error'), message);
    },
  });
  const { mutate: mutatePrepare } = prepareMutation;
  const { mutate: mutateScan } = scanMutation;

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
      if (asset) mutatePrepare(asset);
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
    if (asset) mutatePrepare(asset);
  }, [mutatePrepare]);

  const handleTrigger = useCallback((type: ScanTriggeredType) => {
    if (!isScanOn) {
      showScanOffAlert(isAiEnabled, () => router.push('/settings/ai'));
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

  React.useEffect(() => {
    if (!hasShareIntent || isLocked || isFirstTime) return;
    const action = resolveShareAction(shareIntent, isScanOn);
    resetShareIntent();
    if (!action) return;
    if (action.kind === 'scan-image') {
      mutatePrepare(action);
      return;
    }
    if (action.kind === 'scan-text') {
      mutateScan({ text: action.text });
      return;
    }
    const formRoute = { pathname: '/transactions/new', params: { note: action.note } } as const;
    if (isTransactionFormRoute) router.replace(formRoute);
    else router.push(formRoute);
    showScanOffAlert(isAiEnabled, () => router.push('/settings/ai'));
  }, [hasShareIntent, shareIntent, resetShareIntent, isLocked, isFirstTime, isScanOn, isAiEnabled, isTransactionFormRoute, router, mutatePrepare, mutateScan]);

  if (!scanMutation.isPending) return null;
  return <ScanLoadingOverlay onClose={() => scanMutation.reset()} />;
}

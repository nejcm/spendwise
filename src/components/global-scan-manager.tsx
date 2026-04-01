import type { Action } from 'expo-image-manipulator';
import type { ScannedReceipt, ScanVariables } from '@/features/ai/use-scan-receipt';
import { useMutation } from '@tanstack/react-query';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useCallback } from 'react';
import { Alert } from '@/components/ui';
import { useScanReceipt } from '@/features/ai/use-scan-receipt';
import { translate } from '@/lib/i18n';
import { closeScan, openSheet, useLocalStore } from '@/lib/local-store';
import { selectIsAiEnabled, useAppStore } from '@/lib/store';
import { useThemeConfig } from '@/lib/theme/use-theme-config';
import { ActivityIndicator, Modal, Text } from './ui';

const MAX_IMAGE_DIMENSION = 1024;

async function resizeForAI(asset: ImagePicker.ImagePickerAsset): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  const longerSide = Math.max(asset.width, asset.height);
  const actions: Action[] = longerSide > MAX_IMAGE_DIMENSION
    ? [{ resize: asset.width >= asset.height ? { width: MAX_IMAGE_DIMENSION } : { height: MAX_IMAGE_DIMENSION } }]
    : [];

  const context = ImageManipulator.manipulate(asset.uri);
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
  const isAiEnabled = useAppStore(selectIsAiEnabled);
  const scanTriggered = useLocalStore.use.scanTriggered();

  const onSuccess = (result: ScannedReceipt) => {
    openSheet({ type: 'add-transaction', initialValues: result });
  };
  const scanMutation = useScanReceipt(onSuccess);

  const prepareMutation = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset): Promise<ScanVariables> => {
      const { base64, mimeType } = await resizeForAI(asset);
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

  const handleTrigger = useCallback(async () => {
    if (!isAiEnabled) {
      Alert.alert(
        translate('scan.no_key_title'),
        translate('scan.no_key_message'),
        [
          { text: translate('common.cancel'), style: 'cancel' },
          { text: translate('scan.go_to_settings'), onPress: () => router.push('/settings/ai') },
        ],
      );
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(translate('common.error'), translate('scan.camera_permission_denied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    mutatePrepare(asset);
  }, [isAiEnabled, router, mutatePrepare]);

  React.useEffect(() => {
    if (!scanTriggered) return;
    closeScan();
    void handleTrigger();
  }, [scanTriggered, handleTrigger]);

  if (!scanMutation.isPending) return null;
  return <ScanLoadingOverlay onClose={() => scanMutation.reset()} />;
}

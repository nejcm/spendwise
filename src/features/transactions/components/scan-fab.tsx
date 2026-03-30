import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import { ScanLine } from '@/components/ui/icon';
import { useScanReceipt } from '@/features/ai/use-scan-receipt';
import { translate } from '@/lib/i18n';
import { openSheet } from '@/lib/local-store';
import { useAppStore } from '@/lib/store';

function ScanLoadingOverlay() {
  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/60">
        <View className="items-center gap-3 rounded-2xl bg-white px-8 py-6">
          <ActivityIndicator size="large" />
          <Text className="text-base font-medium">{translate('scan.analyzing')}</Text>
        </View>
      </View>
    </Modal>
  );
}

async function pickImage(source: 'camera' | 'gallery'): Promise<ImagePicker.ImagePickerAsset | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(translate('common.error'), translate('scan.camera_permission_denied'));
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    return result.canceled ? null : (result.assets[0] ?? null);
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(translate('common.error'), translate('scan.gallery_permission_denied'));
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
  });
  return result.canceled ? null : (result.assets[0] ?? null);
}

function getMimeType(asset: ImagePicker.ImagePickerAsset): 'image/jpeg' | 'image/png' {
  const uri = asset.uri.toLowerCase();
  return uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

export function ScanFab() {
  const router = useRouter();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();
  const hasKey = Boolean(openaiApiKey) || Boolean(anthropicApiKey);
  const { isScanning, scan } = useScanReceipt();

  const handlePress = () => {
    if (!hasKey) {
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

    Alert.alert(
      translate('scan.source_title'),
      undefined,
      [
        { text: translate('scan.source_camera'), onPress: () => void handleScan('camera') },
        { text: translate('scan.source_gallery'), onPress: () => void handleScan('gallery') },
        { text: translate('common.cancel'), style: 'cancel' },
      ],
    );
  };

  const handleScan = async (source: 'camera' | 'gallery') => {
    const asset = await pickImage(source);
    if (!asset || !asset.base64) return;

    try {
      const mimeType = getMimeType(asset);
      const result = await scan(asset.base64, mimeType);
      openSheet({
        type: 'add-transaction',
        initialValues: {
          amount: result.amount,
          currency: result.currency,
          date: result.date,
          note: result.note,
          type: result.type,
          category_id: result.category_id ?? undefined,
        },
      });
    }
    catch (error) {
      const message = error instanceof Error ? error.message : translate('scan.error_generic');
      Alert.alert(translate('common.error'), message);
    }
  };

  return (
    <>
      {isScanning && <ScanLoadingOverlay />}
      <Pressable
        onPress={handlePress}
        hitSlop={8}
        className="rounded-full p-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        accessibilityLabel={translate('scan.button_label')}
      >
        <ScanLine className="size-5 text-foreground" />
      </Pressable>
    </>
  );
}

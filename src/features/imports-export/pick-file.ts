import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

function isAllowedByNameOrMime(asset: DocumentPicker.DocumentPickerAsset, ext: string, mimeNeedle: string): boolean {
  const name = asset.name?.toLowerCase();
  const mime = asset.mimeType?.toLowerCase();
  return (name?.endsWith(ext) ?? false) || (mime?.includes(mimeNeedle) ?? false);
}

type PickValidatedFileOptions = Readonly<{
  type: DocumentPicker.DocumentPickerOptions['type'];
  ext: `.${string}`;
  mimeNeedle: string;
  errorMessage: string;
}>;

export async function pickValidatedFile({
  type,
  ext,
  mimeNeedle,
  errorMessage,
}: PickValidatedFileOptions): Promise<DocumentPicker.DocumentPickerAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type,
  });

  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;

  if (!isAllowedByNameOrMime(asset, ext, mimeNeedle)) {
    throw new Error(errorMessage);
  }

  return asset;
}

export function documentPickerTypeForCsv(): DocumentPicker.DocumentPickerOptions['type'] {
  if (Platform.OS === 'android') return '*/*';
  if (Platform.OS === 'ios') return ['public.comma-separated-values-text', 'text/csv', 'public.text', 'text/plain'];
  return 'text/csv';
}

export function documentPickerTypeForJson(): DocumentPicker.DocumentPickerOptions['type'] {
  if (Platform.OS === 'android') return '*/*';
  if (Platform.OS === 'ios') return ['public.json', 'application/json', 'public.text', 'text/plain'];
  return 'application/json';
}

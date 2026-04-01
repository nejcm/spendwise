import type { ScannedReceipt } from './service/scan';
import { useMutation } from '@tanstack/react-query';
import { Alert } from '@/components/ui';
import { useCategories } from '@/features/categories/api';
import { translate } from '@/lib/i18n';
import { scanReceiptImage } from './service/scan';

export type { ScannedReceipt };

export type ScanVariables = {
  base64Image: string;
  mimeType: 'image/jpeg' | 'image/png';
};

export function useScanReceipt(onSuccess?: (result: ScannedReceipt) => void) {
  const { data: categories = [] } = useCategories();
  return useMutation({
    mutationFn: ({ base64Image, mimeType }: ScanVariables): Promise<ScannedReceipt> => {
      const categorySlim = categories.map((c) => ({ id: c.id, name: c.name }));
      return scanReceiptImage(base64Image, mimeType, categorySlim);
    },
    onSuccess,
    onError: (error) => {
      const message = error instanceof Error ? error.message : translate('scan.error_generic');
      Alert.alert(translate('common.error'), message);
    },
  });
}

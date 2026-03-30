import type { ScannedReceipt } from './service/scan';
import { useCallback, useState } from 'react';
import { useCategories } from '@/features/categories/api';
import { useAppStore } from '@/lib/store';
import { scanReceiptImage } from './service/scan';

export type { ScannedReceipt };

export type UseScanReceiptReturn = {
  readonly isScanning: boolean;
  readonly scan: (base64Image: string, mimeType: 'image/jpeg' | 'image/png') => Promise<ScannedReceipt>;
};

export function useScanReceipt(): UseScanReceiptReturn {
  const [isScanning, setIsScanning] = useState(false);
  const aiProvider = useAppStore.use.aiProvider();
  const openaiApiKey = useAppStore.use.openaiApiKey();
  const anthropicApiKey = useAppStore.use.anthropicApiKey();
  const { data: categories = [] } = useCategories();

  const apiKey = aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;

  const scan = useCallback(async (base64Image: string, mimeType: 'image/jpeg' | 'image/png'): Promise<ScannedReceipt> => {
    if (!apiKey) throw new Error('No API key configured');
    setIsScanning(true);
    try {
      const categorySlim = categories.map((c) => ({ id: c.id, name: c.name }));
      return await scanReceiptImage(base64Image, mimeType, categorySlim, aiProvider, apiKey);
    }
    finally {
      setIsScanning(false);
    }
  }, [apiKey, categories, aiProvider]);

  return { isScanning, scan };
}

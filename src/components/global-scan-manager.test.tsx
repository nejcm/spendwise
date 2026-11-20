import type { ShareIntent } from 'expo-share-intent';
import { act, render } from '@testing-library/react-native';
import { useShareIntent } from 'expo-share-intent';
import { Alert } from '@/components/ui';
import { clearAppStore, setIsFirstTime, setIsLocked, setLockEnabled, setOpenaiApiKey } from '@/lib/store/store';
import { GlobalScanManager } from './global-scan-manager';

jest.mock('expo-share-intent', () => ({ useShareIntent: jest.fn() }));
jest.mock('expo-router', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));
jest.mock('@/components/ui', () => ({ Alert: { alert: jest.fn() } }));
jest.mock('@/features/accounts/api', () => ({ useAccounts: () => ({ data: [] }) }));
jest.mock('@/features/categories/api', () => ({ useCategories: () => ({ data: [] }) }));
jest.mock('@/features/transactions/api', () => ({ useCreateTransaction: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/features/ai/use-scan-receipt', () => ({
  useScanReceipt: () => ({ mutate: mockScan, isPending: false, reset: jest.fn() }),
}));
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: jest.fn() }) }));

const mockPush = jest.fn();
const mockScan = jest.fn();
const useShareIntentMock = jest.mocked(useShareIntent);
const EMPTY: ShareIntent = { files: null, text: null, webUrl: null, type: null };

let current: ShareIntent = EMPTY;
const resetShareIntent = jest.fn(() => {
  current = EMPTY;
});

function share(text: string) {
  current = { ...EMPTY, type: 'text', text };
}

beforeEach(() => {
  clearAppStore();
  setIsFirstTime(false);
  setOpenaiApiKey('sk-test');
  current = EMPTY;
  jest.clearAllMocks();
  useShareIntentMock.mockImplementation(() => ({
    isReady: true,
    hasShareIntent: Boolean(current.text || current.files),
    shareIntent: current,
    resetShareIntent,
    error: null,
  }));
});

describe('share handling', () => {
  it('scans shared text once and clears the share', () => {
    share('Paid €12.50 at Lidl');
    const { rerender } = render(<GlobalScanManager />);
    rerender(<GlobalScanManager />);

    expect(mockScan).toHaveBeenCalledTimes(1);
    expect(mockScan).toHaveBeenCalledWith({ text: 'Paid €12.50 at Lidl' });
    expect(resetShareIntent).toHaveBeenCalledTimes(1);
  });

  it('waits for unlock before processing a share', () => {
    setLockEnabled(true);
    setIsLocked(true);
    share('Paid €12.50');
    render(<GlobalScanManager />);

    expect(mockScan).not.toHaveBeenCalled();
    expect(resetShareIntent).not.toHaveBeenCalled();

    act(() => setIsLocked(false));

    expect(mockScan).toHaveBeenCalledTimes(1);
  });

  it('waits for onboarding to finish', () => {
    setIsFirstTime(true);
    share('Paid €12.50');
    render(<GlobalScanManager />);

    expect(mockScan).not.toHaveBeenCalled();
  });

  it('opens the form with the text as a note and sends nothing without a key', () => {
    setOpenaiApiKey(undefined);
    share('Paid €12.50');
    render(<GlobalScanManager />);

    expect(mockScan).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/transactions/new', params: { note: 'Paid €12.50' } });
    expect(Alert.alert).toHaveBeenCalledWith('AI key not set up', expect.any(String), expect.any(Array));
  });
});

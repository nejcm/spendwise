import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { triggerScan } from '@/lib/store/local-store';
import { clearAppStore, setIsFirstTime, setOpenaiApiKey } from '@/lib/store/store';
import { GlobalScanManager } from './global-scan-manager';

jest.mock('expo-share-intent/build/ExpoShareIntentModule', () => ({
  __esModule: true,
  default: {
    addListener: (name: string, handler: (event: { value: unknown }) => void) => {
      mockNativeHandlers[name] = handler;
      return { remove: jest.fn() };
    },
    getShareIntent: jest.fn(),
    clearShareIntent: jest.fn(),
  },
}));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { scheme: 'spendwise' } } }));
jest.mock('expo-linking', () => ({ ...jest.requireActual<object>('expo-linking'), useLinkingURL: () => null }));
jest.mock('expo-router', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: async () => ({ status: 'granted' }),
  launchImageLibraryAsync: () => mockPicker.promise,
}));
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: () => ({
      resize: jest.fn(),
      release: jest.fn(),
      renderAsync: async () => ({ release: jest.fn(), saveAsync: async () => ({ base64: 'aW1n' }) }),
    }),
  },
}));
jest.mock('@/features/ai/service/scan', () => ({
  scanReceiptText: () => mockShareScan.promise,
  scanReceiptImage: () => mockPickerScan.promise,
}));
jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  const Button = ({ label, onPress }: { label: string; onPress: () => void }) => <Pressable onPress={onPress}><Text>{label}</Text></Pressable>;
  return {
    Alert: { alert: jest.fn() },
    ActivityIndicator: () => null,
    GhostButton: Button,
    Image: () => null,
    Modal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? <View>{children}</View> : null),
    SolidButton: Button,
    Text,
    View,
  };
});
jest.mock('@/features/accounts/api', () => ({ useAccounts: () => ({ data: [] }) }));
jest.mock('@/features/categories/api', () => ({ useCategories: () => ({ data: [] }) }));
jest.mock('@/features/transactions/api', () => ({ useCreateTransaction: () => ({ mutateAsync: jest.fn() }) }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const mockNativeHandlers: Record<string, (event: { value: unknown }) => void> = {};
const mockPush = jest.fn();
let mockPicker = deferred<unknown>();
let mockShareScan = deferred<unknown>();
let mockPickerScan = deferred<unknown>();

beforeEach(() => {
  clearAppStore();
  setIsFirstTime(false);
  setOpenaiApiKey('sk-test');
  jest.clearAllMocks();
  mockPicker = deferred();
  mockShareScan = deferred();
  mockPickerScan = deferred();
  Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true, writable: true });
});

it('keeps the share actionable when a picker scan supersedes its failed scan, acting once per press', async () => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  render(<QueryClientProvider client={client}><GlobalScanManager /></QueryClientProvider>);
  await act(async () => triggerScan('gallery'));
  act(() => mockNativeHandlers.onChange!({ value: { text: 'Paid €12.50', type: 'text' } }));
  fireEvent.press(screen.getByText('Scan with AI'));

  await act(async () => mockPicker.resolve({ canceled: false, assets: [{ uri: 'file:///g.jpg', width: 800, height: 600 }] }));
  await act(async () => {
    mockShareScan.reject(new Error('offline'));
    mockPickerScan.reject(new Error('offline'));
  });

  mockShareScan = deferred();
  fireEvent.press(await screen.findByText('Scan with AI'));
  await act(async () => mockShareScan.resolve({ amount: 1250, type: 'expense' }));

  await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  expect(screen.queryByText('Scan with AI')).toBeNull();
});

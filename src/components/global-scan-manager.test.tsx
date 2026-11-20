import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';
import { Alert } from '@/components/ui';
import { clearAppStore, setIsFirstTime, setIsLocked, setLockEnabled, setOpenaiApiKey } from '@/lib/store/store';
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
jest.mock('expo-linking', () => ({ ...jest.requireActual<object>('expo-linking'), useLinkingURL: () => mockLinking.url }));
jest.mock('expo-router', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));
jest.mock('@/components/ui', () => {
  const { Pressable, Text, View } = require('react-native');
  const Button = ({ label, onPress }: { label: string; onPress: () => void }) => <Pressable onPress={onPress}><Text>{label}</Text></Pressable>;
  return {
    Alert: { alert: jest.fn() },
    ActivityIndicator: () => null,
    GhostButton: Button,
    Image: () => <Text>image preview</Text>,
    Modal: ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (visible ? <View>{children}</View> : null),
    SolidButton: Button,
    Text,
    View,
  };
});
jest.mock('@/features/accounts/api', () => ({ useAccounts: () => ({ data: [] }) }));
jest.mock('@/features/categories/api', () => ({ useCategories: () => ({ data: [] }) }));
jest.mock('@/features/transactions/api', () => ({ useCreateTransaction: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/features/ai/use-scan-receipt', () => ({
  useScanReceipt: () => ({ mutate: mockScan, isPending: mockScanState.pending, reset: jest.fn() }),
}));
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: mockPrepare, isPending: false }) }));

const mockNativeHandlers: Record<string, (event: { value: unknown }) => void> = {};
const mockLinking = { url: null as string | null };
const mockPush = jest.fn();
const mockScan = jest.fn();
const mockPrepare = jest.fn();
const mockScanState = { pending: false };
const nativeModule = jest.requireMock<{ default: { getShareIntent: jest.Mock; clearShareIntent: jest.Mock } }>('expo-share-intent/build/ExpoShareIntentModule').default;
const appStateListeners = new Set<(state: string) => void>();
const originalAppState = AppState.currentState;

function setCurrentAppState(state: string) {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true, writable: true });
}

function shareText(text: string) {
  act(() => mockNativeHandlers.onChange!({ value: { text, type: 'text' } }));
}

function shareImage(path: string) {
  act(() => mockNativeHandlers.onChange!({ value: { files: [{ path, mimeType: 'image/jpeg', fileName: 'r.jpg', width: '800', height: '600' }], type: 'file' } }));
}

beforeEach(() => {
  clearAppStore();
  setIsFirstTime(false);
  setOpenaiApiKey('sk-test');
  mockLinking.url = null;
  mockScanState.pending = false;
  jest.clearAllMocks();
  setCurrentAppState('active');
  appStateListeners.clear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    const appStateListener = listener as (state: string) => void;
    appStateListeners.add(appStateListener);
    return { remove: () => appStateListeners.delete(appStateListener) };
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  Object.defineProperty(AppState, 'currentState', { value: originalAppState, configurable: true, writable: true });
});

describe('startup', () => {
  it('reads the share link iOS cached before the app subscribed', () => {
    mockLinking.url = 'spendwise://dataUrl=spendwiseShareKey?nonce=A#text';
    render(<GlobalScanManager />);

    expect(nativeModule.getShareIntent).toHaveBeenCalledWith(mockLinking.url);
  });

  it('pulls the share Android stored before the app subscribed', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    render(<GlobalScanManager />);

    expect(nativeModule.getShareIntent).toHaveBeenCalledWith('');
  });
});

describe('shared item sheet', () => {
  it('waits for the foreground lock check and unlock before showing the item', () => {
    setCurrentAppState('background');
    setLockEnabled(true);
    render(<GlobalScanManager />);
    shareText('Paid €12.50');

    act(() => {
      appStateListeners.forEach((listener) => listener('active'));
      setIsLocked(true);
    });
    expect(screen.queryByText('Paid €12.50')).toBeNull();

    act(() => setIsLocked(false));
    expect(screen.getByText('Shared item')).toBeTruthy();
    expect(screen.getByText('Paid €12.50')).toBeTruthy();
    expect(mockScan).not.toHaveBeenCalled();
  });

  it('waits for onboarding to finish', () => {
    setIsFirstTime(true);
    render(<GlobalScanManager />);
    shareText('Paid €12.50');

    expect(screen.queryByText('Shared item')).toBeNull();
  });

  it('shows the newest item when another share arrives while it is open', () => {
    render(<GlobalScanManager />);
    shareText('First');
    shareText('Second');

    expect(screen.queryByText('First')).toBeNull();
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('discards the item and clears the native slot', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Discard'));

    expect(screen.queryByText('Shared item')).toBeNull();
    expect(nativeModule.clearShareIntent).toHaveBeenCalled();
    expect(mockScan).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('fills the form manually with the text as the note', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Fill in manually'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/transactions/new', params: { note: 'Paid €12.50' } });
    expect(screen.queryByText('Shared item')).toBeNull();
  });

  it('fills the form manually without a note for an image', () => {
    render(<GlobalScanManager />);
    shareImage('file:///r.jpg');

    expect(screen.getByText('image preview')).toBeTruthy();
    fireEvent.press(screen.getByText('Fill in manually'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/transactions/new', params: { note: undefined } });
  });

  it('offers no AI scan without a key', () => {
    setOpenaiApiKey(undefined);
    render(<GlobalScanManager />);
    shareText('Paid €12.50');

    expect(screen.getByText('Fill in manually')).toBeTruthy();
    expect(screen.queryByText('Scan with AI')).toBeNull();
  });

  it('scans text and images only when asked', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Scan with AI'));

    expect(mockScan).toHaveBeenCalledWith({ text: 'Paid €12.50' });
    expect(screen.queryByText('Shared item')).toBeNull();

    shareImage('file:///r.jpg');
    fireEvent.press(screen.getByText('Scan with AI'));
    expect(mockPrepare).toHaveBeenCalledWith({ kind: 'image', uri: 'file:///r.jpg', width: 800, height: 600 });
  });

  it('holds a share that arrives during a scan until the scan finishes', () => {
    mockScanState.pending = true;
    const { rerender } = render(<GlobalScanManager />);
    shareText('Paid €12.50');

    expect(screen.queryByText('Shared item')).toBeNull();

    mockScanState.pending = false;
    rerender(<GlobalScanManager />);
    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });

  it('alerts and resets on a receiver error', () => {
    render(<GlobalScanManager />);
    act(() => mockNativeHandlers.onError!({ value: 'Cannot retreive appGroupIdentifier' }));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not read the shared item. Please try sharing it again.');
    expect(nativeModule.clearShareIntent).toHaveBeenCalled();
  });

  it('alerts and resets on a share with nothing usable', () => {
    render(<GlobalScanManager />);
    act(() => mockNativeHandlers.onChange!({ value: { files: [{ path: 'file:///v.mp4', mimeType: 'video/mp4', fileName: 'v.mp4' }], type: 'file' } }));

    expect(screen.queryByText('Shared item')).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not read the shared item. Please try sharing it again.');
    expect(nativeModule.clearShareIntent).toHaveBeenCalled();
  });
});

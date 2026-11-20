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
  const { useEffect } = require('react');
  const { Pressable, Text, View } = require('react-native');
  const Button = ({ label, onPress }: { label: string; onPress: () => void }) => {
    useEffect(() => {
      mockButtonPresses[label] = onPress;
    });
    return <Pressable onPress={onPress}><Text>{label}</Text></Pressable>;
  };
  return {
    Alert: { alert: jest.fn() },
    ActivityIndicator: () => null,
    GhostButton: Button,
    Image: () => <Text>image preview</Text>,
    Modal: ({ visible, children, onClose }: { visible: boolean; children: React.ReactNode; onClose?: () => void }) => (visible
      ? (
          <View>
            {onClose && <Button label="Close modal" onPress={onClose} />}
            {children}
          </View>
        )
      : null),
    SolidButton: Button,
    Text,
    View,
  };
});
jest.mock('@/features/accounts/api', () => ({ useAccounts: () => ({ data: [] }) }));
jest.mock('@/features/categories/api', () => ({ useCategories: () => ({ data: [] }) }));
jest.mock('@/features/transactions/api', () => ({ useCreateTransaction: () => ({ mutateAsync: jest.fn() }) }));
jest.mock('@/features/ai/use-scan-receipt', () => ({
  useScanReceipt: (onSuccess: (result: unknown, variables: unknown) => Promise<void>) => {
    mockScanState.onSuccess = onSuccess;
    return { mutate: mockScan, isPending: mockScanState.pending, reset: jest.fn() };
  },
}));
jest.mock('@tanstack/react-query', () => ({ useMutation: () => ({ mutate: mockPrepare, isPending: false }) }));

const mockNativeHandlers: Record<string, (event: { value: unknown }) => void> = {};
const mockLinking = { url: null as string | null };
const mockPush = jest.fn();
const mockButtonPresses: Record<string, () => void> = {};
const mockScan = jest.fn();
const mockPrepare = jest.fn();
const mockScanState = { pending: false, onSuccess: (async () => {}) as (result: unknown, variables: unknown) => Promise<void> };
const nativeModule = jest.requireMock<{ default: { getShareIntent: jest.Mock; clearShareIntent: jest.Mock } }>('expo-share-intent/build/ExpoShareIntentModule').default;
const appStateListeners = new Set<(state: string) => void>();
const originalAppState = AppState.currentState;

function setCurrentAppState(state: string) {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true, writable: true });
}

type ScanCall = [unknown, { onSettled: () => void }];

async function succeedScan([variables, { onSettled }]: ScanCall = mockScan.mock.lastCall as ScanCall) {
  await act(async () => {
    await mockScanState.onSuccess({ amount: 1250, type: 'expense' }, variables);
    onSettled();
  });
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
      setCurrentAppState('active');
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

  it('clears the native slot as soon as a share is read', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');

    expect(nativeModule.clearShareIntent).toHaveBeenCalledWith('spendwiseShareKey');
    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });

  it('discards the item', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Discard'));

    expect(screen.queryByText('Shared item')).toBeNull();
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
});

describe('scanning a shared item', () => {
  it('scans text and images only when asked', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Scan with AI'));

    expect(mockScan.mock.lastCall![0]).toEqual({ text: 'Paid €12.50' });

    shareImage('file:///r.jpg');
    fireEvent.press(screen.getByText('Scan with AI'));
    expect(mockPrepare.mock.lastCall![0]).toEqual({ image: { kind: 'image', uri: 'file:///r.jpg', width: 800, height: 600 }, shareId: expect.any(Number) });
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

  it('offers the item again when the scan fails and clears it once a scan succeeds', async () => {
    const { rerender } = render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Scan with AI'));
    mockScanState.pending = true;
    rerender(<GlobalScanManager />);
    expect(screen.queryByText('Shared item')).toBeNull();

    mockScanState.pending = false;
    act(() => (mockScan.mock.lastCall as ScanCall)[1].onSettled());
    rerender(<GlobalScanManager />);
    expect(screen.getByText('Paid €12.50')).toBeTruthy();

    fireEvent.press(screen.getByText('Scan with AI'));
    expect(mockScan).toHaveBeenCalledTimes(2);
    await succeedScan();
    expect(screen.queryByText('Shared item')).toBeNull();
  });

  it('keeps a share that replaced the scanned one during the scan', async () => {
    render(<GlobalScanManager />);
    shareText('First');
    fireEvent.press(screen.getByText('Scan with AI'));
    shareText('Second');
    await succeedScan();

    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('keeps an identical newer share when the earlier one is saved', async () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Scan with AI'));
    shareText('Paid €12.50');
    await succeedScan();

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });

  it('keeps a newer share delivered in the same batch as the save', async () => {
    render(<GlobalScanManager />);
    shareText('First');
    fireEvent.press(screen.getByText('Scan with AI'));
    const [variables, { onSettled }] = mockScan.mock.lastCall as ScanCall;
    await act(async () => {
      mockNativeHandlers.onChange!({ value: { text: 'Second', type: 'text' } });
      await mockScanState.onSuccess({ amount: 1250, type: 'expense' }, variables);
      onSettled();
    });

    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('acts once on a share pressed twice before the sheet re-renders', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    const fill = mockButtonPresses['Fill in manually']!;
    act(() => {
      fill();
      fill();
    });

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('ignores Fill after Scan on the same share', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    const scan = mockButtonPresses['Scan with AI']!;
    const fill = mockButtonPresses['Fill in manually']!;
    act(() => {
      scan();
      fill();
    });

    expect(mockScan).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('saves once when a dismissed scan finishes after a rescan', async () => {
    const { rerender } = render(<GlobalScanManager />);
    shareText('Paid €12.50');
    fireEvent.press(screen.getByText('Scan with AI'));
    const [dismissedScan] = mockScan.mock.lastCall as ScanCall;
    mockScanState.pending = true;
    rerender(<GlobalScanManager />);
    fireEvent.press(screen.getByText('Close modal'));
    mockScanState.pending = false;
    rerender(<GlobalScanManager />);
    fireEvent.press(screen.getByText('Scan with AI'));

    await act(() => mockScanState.onSuccess({ amount: 1250, type: 'expense' }, dismissedScan));
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('Paid €12.50')).toBeTruthy();

    await succeedScan();
    await succeedScan();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Shared item')).toBeNull();
  });

  it('opens a new item only once iOS is active', () => {
    setCurrentAppState('inactive');
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    expect(screen.queryByText('Shared item')).toBeNull();

    act(() => {
      setCurrentAppState('active');
      appStateListeners.forEach((listener) => listener('active'));
    });
    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });

  it('keeps the item open while iOS is briefly inactive', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    act(() => {
      setCurrentAppState('inactive');
      appStateListeners.forEach((listener) => listener('inactive'));
    });

    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });

  it('sees a foreground that happened between render and subscribe', () => {
    setCurrentAppState('background');
    jest.mocked(AppState.addEventListener).mockImplementationOnce(() => {
      setCurrentAppState('active');
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    render(<GlobalScanManager />);
    shareText('Paid €12.50');

    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });
});

describe('receiver errors', () => {
  it('shows a good share that follows a failed one, alerting once', () => {
    setCurrentAppState('background');
    render(<GlobalScanManager />);
    act(() => mockNativeHandlers.onError!({ value: 'Cannot read share intent: query failed' }));
    shareText('Paid €12.50');
    act(() => {
      setCurrentAppState('active');
      appStateListeners.forEach((listener) => listener('active'));
    });

    expect(screen.getByText('Paid €12.50')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('keeps a good share that arrives in the same batch as an error, alerting once', () => {
    render(<GlobalScanManager />);
    act(() => {
      mockNativeHandlers.onError!({ value: 'Cannot read share intent: query failed' });
      mockNativeHandlers.onChange!({ value: { text: 'Paid €12.50', type: 'text' } });
    });

    expect(screen.getByText('Paid €12.50')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('alerts and resets on a receiver error', () => {
    render(<GlobalScanManager />);
    act(() => mockNativeHandlers.onError!({ value: 'Cannot retreive appGroupIdentifier' }));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not read the shared item. Please try sharing it again.');
  });

  it('alerts once per receiver error, even with the same message', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    act(() => mockNativeHandlers.onError!({ value: 'No text in text share' }));
    act(() => mockNativeHandlers.onError!({ value: 'No text in text share' }));

    expect(Alert.alert).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });

  it('alerts but keeps the open item when a newer share fails to read', () => {
    render(<GlobalScanManager />);
    shareText('Paid €12.50');
    act(() => mockNativeHandlers.onError!({ value: 'Cannot read share intent: query failed' }));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Paid €12.50')).toBeTruthy();
  });

  it('alerts and resets when Android sends a file without a type', () => {
    render(<GlobalScanManager />);
    act(() => mockNativeHandlers.onChange!({ value: { files: [{ contentUri: 'content://r', filePath: null }], type: 'file' } }));

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

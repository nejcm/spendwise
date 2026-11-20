import { act, renderHook, waitFor } from '@testing-library/react-native';
import { ShareIntentModule } from 'expo-share-intent';
import { Linking } from 'react-native';
import { useIncomingShare } from './use-incoming-share';

jest.mock('expo-share-intent', () => {
  const handlers: Record<string, (event: { value: unknown }) => void> = {};
  return {
    ...jest.requireActual<object>('expo-share-intent'),
    getScheme: () => 'spendwise',
    getShareExtensionKey: () => 'spendwiseShareKey',
    ShareIntentModule: {
      handlers,
      addListener: (name: string, handler: (event: { value: unknown }) => void) => {
        handlers[name] = handler;
        return { remove: jest.fn() };
      },
      getShareIntent: jest.fn(),
      clearShareIntent: jest.fn(async () => {}),
    },
  };
});

const nativeModule = ShareIntentModule as unknown as {
  handlers: Record<string, (event: { value: unknown }) => void>;
  getShareIntent: jest.Mock;
  clearShareIntent: jest.Mock;
};
const SHARE_URL = 'spendwise://dataUrl=spendwiseShareKey?nonce=A#text';
let openUrl: (url: string) => void;

function emit(name: 'onChange' | 'onError', value: unknown) {
  act(() => nativeModule.handlers[name]!({ value }));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
  jest.spyOn(Linking, 'addEventListener').mockImplementation((_type, handler) => {
    openUrl = (url) => handler({ url });
    return { remove: jest.fn() } as never;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useIncomingShare', () => {
  it('reads each share link once and keeps other links away from the native reader', () => {
    renderHook(() => useIncomingShare());

    openUrl(SHARE_URL);
    openUrl(SHARE_URL);
    openUrl('spendwise://dataUrl=spendwiseShareKey?nonce=B');
    openUrl('spendwise://transactions/new?note=dataUrl%3DspendwiseShareKey#text');

    expect(nativeModule.getShareIntent).toHaveBeenCalledTimes(1);
    expect(nativeModule.getShareIntent).toHaveBeenCalledWith(SHARE_URL);
  });

  it('reads the share link the app was opened with', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(SHARE_URL);
    renderHook(() => useIncomingShare());

    await waitFor(() => expect(nativeModule.getShareIntent).toHaveBeenCalledWith(SHARE_URL));
  });

  it('holds one share, clears it natively, and flags a share that replaced an unhandled one', () => {
    const { result } = renderHook(() => useIncomingShare());

    emit('onChange', '{"text":"First","type":"text"}');
    expect(result.current[0]).toMatchObject({ shareIntent: { text: 'First' }, replacedEarlier: false });
    expect(nativeModule.clearShareIntent).toHaveBeenCalledWith('spendwiseShareKey');

    emit('onChange', '{"text":"Second","type":"text"}');
    expect(result.current[0]).toMatchObject({ shareIntent: { text: 'Second' }, replacedEarlier: true });

    act(() => result.current[1]());
    expect(result.current[0]).toBeNull();
  });

  it('surfaces a receiver error without dropping a share that is already waiting', () => {
    const { result } = renderHook(() => useIncomingShare());

    emit('onError', 'Cannot retreive appGroupIdentifier');
    expect(result.current[0]).toEqual({ error: 'Cannot retreive appGroupIdentifier' });

    emit('onChange', '{"text":"Paid","type":"text"}');
    emit('onError', 'file type is Invalid');
    expect(result.current[0]).toMatchObject({ shareIntent: { text: 'Paid' }, replacedEarlier: false });
  });
});

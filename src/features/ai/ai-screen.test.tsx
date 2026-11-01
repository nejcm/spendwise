import type { UseChatReturn } from './types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import AssistantMessage from '@/features/ai/components/assistant-message';

import { AiScreen } from './ai-screen';
import { useChat } from './use-chat';

jest.mock('./use-chat', () => ({
  useChat: jest.fn(),
}));

jest.mock('@/features/ai/components/assistant-message', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@/components/ui/focus-aware-status-bar', () => ({
  FocusAwareStatusBar: () => null,
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => null,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

jest.mock('@/components/ui/icon', () => ({
  ArrowUp: () => null,
  Brain: () => null,
  Calendar: () => null,
  Check: () => null,
  ChevronDown: () => null,
  ChevronLeft: () => null,
  SlidersHorizontal: () => null,
  Sparkle: () => null,
  SquarePen: () => null,
  X: () => null,
}));

jest.mock('./components/scope-sheet', () => ({
  ScopeSheet: () => null,
}));

jest.mock('@/features/accounts/api', () => ({
  useAccounts: () => ({ data: [] }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

const mockRouterPush = jest.fn();
const chatHookMock = useChat as jest.MockedFunction<typeof useChat>;
const AssistantMessageMock = AssistantMessage as jest.MockedFunction<typeof AssistantMessage>;

function mockChat(overrides: Partial<UseChatReturn> = {}) {
  const base: UseChatReturn = {
    hasKey: true,
    messages: [],
    draftQuestion: '',
    isStreaming: false,
    streamedAssistantContent: '',
    errorMessage: null,
    toolStatus: null,
    actions: {
      send: jest.fn(),
      setDraft: jest.fn(),
      reset: jest.fn(),
      applyScope: jest.fn(),
    },
    scroll: {
      scrollViewRef: { current: null },
      onContentSizeChange: jest.fn(),
      onScrollViewLayout: jest.fn(),
      onMessageLayout: jest.fn(),
      shouldShowBottomFiller: false,
      bottomFillerHeight: 0,
    },
    getMessageRenderInfo: jest.fn(() => ({
      displayContent: '',
      isLiveStreaming: false,
    })),
    markdownStyle: {},
  };

  chatHookMock.mockReturnValue({ ...base, ...overrides });
}

describe('ai screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains that AI chat requires a user-provided provider key', () => {
    mockChat({ hasKey: false });

    render(<AiScreen />);

    expect(screen.getByText('Bring your own AI key')).toBeTruthy();
    expect(screen.getByText(/They use your own OpenAI or Anthropic key, which stays on this phone/)).toBeTruthy();
    fireEvent.press(screen.getByText('Open AI settings'));
    expect(mockRouterPush).toHaveBeenCalledWith('/settings/ai');
    expect(screen.queryByPlaceholderText(/./)).toBeNull();
    expect(screen.queryByLabelText('New chat')).toBeNull();
  });

  it('shows the focus chip with the default scope and starts a new chat from the header', () => {
    const reset = jest.fn();
    mockChat({
      messages: [{ id: 'user-1', role: 'user', content: 'Hi' }],
      actions: { send: jest.fn(), setDraft: jest.fn(), reset, applyScope: jest.fn() },
    });

    render(<AiScreen />);

    expect(screen.getByText(/ · All accounts$/)).toBeTruthy();
    fireEvent.press(screen.getByLabelText('New chat'));
    expect(reset).toHaveBeenCalled();
  });

  it('renders live assistant content as raw text while streaming', () => {
    mockChat({
      hasKey: true,
      messages: [{ id: 'assistant-1', role: 'assistant', content: '' }],
      isStreaming: true,
      streamedAssistantContent: 'hello **world**',
      getMessageRenderInfo: jest.fn(() => ({
        displayContent: 'hello **world**',
        isLiveStreaming: true,
      })),
    });

    render(<AiScreen />);

    expect(screen.getByText('hello **world**')).toBeTruthy();
    expect(AssistantMessageMock).not.toHaveBeenCalled();
  });
});

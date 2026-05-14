import type { UseChatReturn } from './types';
import { render, screen } from '@testing-library/react-native';

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

jest.mock('@/components/ui/icon', () => ({
  Brain: () => null,
  Plus: () => null,
  SendHorizonal: () => null,
}));

jest.mock('@/components/screen-header', () => ({
  BackButton: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

const useChatMock = useChat as jest.MockedFunction<typeof useChat>;
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

  useChatMock.mockReturnValue({ ...base, ...overrides });
}

describe('ai screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains that AI chat requires a user-provided provider key', () => {
    mockChat({ hasKey: false });

    render(<AiScreen />);

    expect(screen.getByText('AI setup required')).toBeTruthy();
    expect(screen.getByText('AI chat needs your own OpenAI or Anthropic API key. Provider usage may cost money.')).toBeTruthy();
    expect(screen.getByText('Open AI settings')).toBeTruthy();
  });

  it('renders live assistant content as raw text while streaming', () => {
    mockChat({
      hasKey: false,
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

import type * as React from 'react';
import type { PeriodSelection } from '@/lib/store';
import { Text } from 'react-native';
import { cleanup, render } from '@/lib/test-utils';

type PanEvent = {
  translationX: number;
};

type PanGestureMock = {
  handlers: {
    onUpdate?: (event: PanEvent) => void;
    onEnd?: (event: PanEvent) => void;
  };
  runsOnJS: boolean;
  activeOffsetX: jest.Mock;
  failOffsetY: jest.Mock;
  runOnJS: jest.Mock;
  onUpdate: jest.Mock;
  onEnd: jest.Mock;
};

let latestPanGesture: PanGestureMock | undefined;
let isWorkletContext = false;

const mockNavigatePeriod = jest.fn();
const mockSetPeriodSelection = jest.fn();

jest.mock('@/lib/date/helpers', () => ({
  navigatePeriod: (...args: unknown[]) => mockNavigatePeriod(...args),
  isNavigablePeriodMode: (mode: string) => mode !== 'all' && mode !== 'custom' && mode !== 'today',
}));

jest.mock('@/lib/store', () => ({
  setPeriodSelection: (...args: unknown[]) => mockSetPeriodSelection(...args),
}));

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Gesture: {
      Pan: () => {
        const gesture: PanGestureMock = {
          handlers: {},
          runsOnJS: false,
          activeOffsetX: jest.fn(),
          failOffsetY: jest.fn(),
          runOnJS: jest.fn(),
          onUpdate: jest.fn(),
          onEnd: jest.fn(),
        };

        gesture.activeOffsetX.mockImplementation(() => gesture);
        gesture.failOffsetY.mockImplementation(() => gesture);
        gesture.runOnJS.mockImplementation((enabled: boolean) => {
          gesture.runsOnJS = enabled;
          return gesture;
        });
        gesture.onUpdate.mockImplementation((handler: PanGestureMock['handlers']['onUpdate']) => {
          gesture.handlers.onUpdate = handler;
          return gesture;
        });
        gesture.onEnd.mockImplementation((handler: PanGestureMock['handlers']['onEnd']) => {
          gesture.handlers.onEnd = handler;
          return gesture;
        });

        latestPanGesture = gesture;
        return gesture;
      },
    },
  };
});

const { PeriodSwipeContainer } = require('./period-swipe-container');

function renderContainer(selection: PeriodSelection) {
  render(
    <PeriodSwipeContainer selection={selection}>
      <Text>Period content</Text>
    </PeriodSwipeContainer>,
  );

  expect(latestPanGesture?.handlers.onEnd).toBeDefined();
}

function endPan(event: PanEvent) {
  const onEnd = latestPanGesture?.handlers.onEnd;
  if (!onEnd) throw new Error('Pan end handler was not registered');

  isWorkletContext = latestPanGesture?.runsOnJS !== true;
  try {
    onEnd(event);
  }
  finally {
    isWorkletContext = false;
  }
}

afterEach(() => {
  cleanup();
  latestPanGesture = undefined;
  isWorkletContext = false;
  jest.clearAllMocks();
});

describe('periodSwipeContainer', () => {
  beforeEach(() => {
    mockNavigatePeriod.mockImplementation((selection: PeriodSelection, direction: -1 | 1) => {
      if (isWorkletContext) {
        throw new Error('navigatePeriod must run on JS');
      }

      if (selection.mode !== 'month') {
        return selection;
      }

      return { mode: 'month', year: selection.year, month: selection.month + direction };
    });

    mockSetPeriodSelection.mockImplementation((selection: PeriodSelection) => {
      if (isWorkletContext) {
        throw new Error(`setPeriodSelection must run on JS: ${JSON.stringify(selection)}`);
      }
    });
  });

  it('moves to the next period after a left swipe', () => {
    const selection: PeriodSelection = { mode: 'month', year: 2026, month: 4 };

    renderContainer(selection);

    expect(() => endPan({ translationX: -60 })).not.toThrow();

    expect(latestPanGesture?.runOnJS).toHaveBeenCalledWith(true);
    expect(mockNavigatePeriod).toHaveBeenCalledWith(selection, 1);
    expect(mockSetPeriodSelection).toHaveBeenCalledWith({ mode: 'month', year: 2026, month: 5 });
  });

  it('moves to the previous period after a right swipe', () => {
    const selection: PeriodSelection = { mode: 'month', year: 2026, month: 4 };

    renderContainer(selection);

    expect(() => endPan({ translationX: 60 })).not.toThrow();

    expect(latestPanGesture?.runOnJS).toHaveBeenCalledWith(true);
    expect(mockNavigatePeriod).toHaveBeenCalledWith(selection, -1);
    expect(mockSetPeriodSelection).toHaveBeenCalledWith({ mode: 'month', year: 2026, month: 3 });
  });

  it('ignores small swipes', () => {
    const selection: PeriodSelection = { mode: 'month', year: 2026, month: 4 };

    renderContainer(selection);
    endPan({ translationX: -20 });

    expect(latestPanGesture?.runOnJS).toHaveBeenCalledWith(true);
    expect(mockNavigatePeriod).not.toHaveBeenCalled();
    expect(mockSetPeriodSelection).not.toHaveBeenCalled();
  });

  it('ignores swipes when all-time mode is selected', () => {
    renderContainer({ mode: 'all' });
    endPan({ translationX: -60 });

    expect(latestPanGesture?.runOnJS).toHaveBeenCalledWith(true);
    expect(mockNavigatePeriod).not.toHaveBeenCalled();
    expect(mockSetPeriodSelection).not.toHaveBeenCalled();
  });

  it('ignores swipes when today mode is selected', () => {
    renderContainer({ mode: 'today' });
    endPan({ translationX: -60 });

    expect(mockNavigatePeriod).not.toHaveBeenCalled();
    expect(mockSetPeriodSelection).not.toHaveBeenCalled();
  });

  it('navigates forward on left swipe when this-week mode is selected', () => {
    const selection: PeriodSelection = { mode: 'this-week' };
    renderContainer(selection);
    endPan({ translationX: -60 });

    expect(mockNavigatePeriod).toHaveBeenCalledWith(selection, 1);
    expect(mockSetPeriodSelection).toHaveBeenCalled();
  });

  it('navigates backward on right swipe when this-month mode is selected', () => {
    const selection: PeriodSelection = { mode: 'this-month' };
    renderContainer(selection);
    endPan({ translationX: 60 });

    expect(mockNavigatePeriod).toHaveBeenCalledWith(selection, -1);
    expect(mockSetPeriodSelection).toHaveBeenCalled();
  });

  it('navigates forward on left swipe when this-year mode is selected', () => {
    const selection: PeriodSelection = { mode: 'this-year' };
    renderContainer(selection);
    endPan({ translationX: -60 });

    expect(mockNavigatePeriod).toHaveBeenCalledWith(selection, 1);
    expect(mockSetPeriodSelection).toHaveBeenCalled();
  });
});

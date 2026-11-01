import * as React from 'react';
import { AccessibilityInfo } from 'react-native';

import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { hideSnackbar, showSnackbar, SnackbarHost } from './snackbar';

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  act(() => hideSnackbar());
  cleanup();
  jest.useRealTimers();
});

describe('snackbar', () => {
  it('shows, announces and hides', () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    render(<SnackbarHost />);

    act(() => showSnackbar({ title: 'Expense saved', subtitle: '−€42.50 · Eating out' }));
    expect(screen.getByText('Expense saved')).toBeOnTheScreen();
    expect(screen.getByText('−€42.50 · Eating out')).toBeOnTheScreen();
    expect(screen.queryByText('Undo')).not.toBeOnTheScreen();
    expect(announce).toHaveBeenCalledWith('Expense saved');

    act(() => hideSnackbar());
    expect(screen.queryByText('Expense saved')).not.toBeOnTheScreen();
  });

  it('runs undo once and dismisses', () => {
    const undo = jest.fn();
    render(<SnackbarHost />);

    act(() => showSnackbar({ title: 'Expense saved', undo }));
    fireEvent.press(screen.getByText('Undo'));

    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Expense saved')).not.toBeOnTheScreen();
  });

  it('auto-dismisses after 4s, restarting for a newer snackbar', () => {
    render(<SnackbarHost />);

    act(() => showSnackbar({ title: 'First' }));
    act(() => jest.advanceTimersByTime(3000));
    act(() => showSnackbar({ title: 'Second' }));
    act(() => jest.advanceTimersByTime(3000));
    expect(screen.getByText('Second')).toBeOnTheScreen();

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.queryByText('Second')).not.toBeOnTheScreen();
  });
});

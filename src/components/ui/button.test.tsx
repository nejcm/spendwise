import * as React from 'react';
import { Text } from 'react-native';

import { cleanup, render, screen, setup } from '@/lib/test-utils';

import { SolidButton } from './button';

afterEach(cleanup);

describe('button component ', () => {
  it('should render correctly ', () => {
    render(<SolidButton testID="button" />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
  });
  it('should render correctly if we add explicit child ', () => {
    render(
      <SolidButton testID="button">
        <Text> Custom child </Text>
      </SolidButton>,
    );
    expect(screen.getByText('Custom child')).toBeOnTheScreen();
  });
  it('should render the label correctly', () => {
    render(<SolidButton testID="button" label="Submit" />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    expect(screen.getByText('Submit')).toBeOnTheScreen();
  });
  it('should render the loading indicator correctly', () => {
    render(<SolidButton testID="button" loading={true} />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    expect(screen.getByTestId('button-activity-indicator')).toBeOnTheScreen();
  });
  it('should call onClick handler when clicked', async () => {
    const onClick = jest.fn();
    const { user } = setup(<SolidButton testID="button" label="Click the button" onPress={onClick} />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    await user.press(screen.getByTestId('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should be disabled when loading', async () => {
    const onClick = jest.fn();
    const { user } = setup(<SolidButton testID="button" loading={true} label="Click the button" onPress={onClick} />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    expect(screen.getByTestId('button-activity-indicator')).toBeOnTheScreen();
    expect(screen.getByTestId('button')).toBeDisabled();
    await user.press(screen.getByTestId('button'));
    expect(onClick).toHaveBeenCalledTimes(0);
  });
  it('should be disabled when disabled prop is true', () => {
    render(<SolidButton testID="button" disabled={true} />);
    expect(screen.getByTestId('button')).toBeDisabled();
  });
  it('shouldn\'t call onClick when disabled', async () => {
    const onClick = jest.fn();
    const { user } = setup(
      <SolidButton testID="button" label="Click the button" disabled={true} onPress={onClick} color="secondary" />,
    );
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    await user.press(screen.getByTestId('button'));

    expect(screen.getByTestId('button')).toBeDisabled();

    expect(onClick).toHaveBeenCalledTimes(0);
  });
  it('should apply correct styles based on size prop', () => {
    render(<SolidButton testID="button" size="lg" label="Submit" />);

    expect(screen.getByTestId('button-label').props.className).toContain('text-lg/snug');
  });
  it('should apply correct styles for label when variant is secondary', () => {
    render(<SolidButton testID="button" color="secondary" label="Submit" />);

    expect(screen.getByTestId('button-label').props.className).toContain('text-muted-foreground');
  });
  it('should apply correct styles for label when is disabled', () => {
    render(<SolidButton testID="button" label="Submit" disabled />);

    expect(screen.getByTestId('button-label').props.className).toContain('text-gray-600 dark:text-gray-600');
  });
});

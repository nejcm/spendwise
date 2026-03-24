import { Text } from './text';

export type InputLabelProps = {
  label: string;
  testID?: string;
  className?: string;
};

// eslint-disable-next-line react-refresh/only-export-components
export const labelDefaults = 'text-foreground mb-1 text-sm/snug';

export function InputLabel({ label, testID, className = labelDefaults }: InputLabelProps) {
  return (
    <Text testID={testID} className={className}>
      {label}
    </Text>
  );
}

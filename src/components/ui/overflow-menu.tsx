import * as React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPressedStyle } from './button';
import { GhostButton } from './ghost-button';
import { EllipsisVertical } from './icon';
import { IconButton } from './icon-button';

export type OverflowMenuItem = {
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
  className?: string;
  hidden?: boolean;
};

type OverflowMenuProps = {
  items: OverflowMenuItem[];
  accessibilityLabel: string;
  className?: string;
  icon?: React.ReactNode;
};

export function OverflowMenu({ items, accessibilityLabel, className, icon }: OverflowMenuProps) {
  const [open, setOpen] = React.useState(false);
  const insets = useSafeAreaInsets();
  const visibleItems = items.filter((item) => !item.hidden);

  const close = React.useCallback(() => setOpen(false), []);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton
        className={className}
        color="none"
        accessibilityLabel={accessibilityLabel}
        onPress={() => setOpen(true)}
      >
        {icon || <EllipsisVertical className="text-muted-foreground" size={20} />}
      </IconButton>
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View className="flex-1">
          <Pressable className="absolute inset-0" onPress={close} />
          <View
            className="absolute right-4 min-w-48 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg"
            style={{ top: insets.top + 48 }}
          >
            {visibleItems.map((item) => (
              <GhostButton
                key={item.label}
                style={getPressedStyle}
                onPress={() => {
                  close();
                  item.onPress();
                }}
                className="justify-start"
                fullWidth
                iconLeft={item.icon}
                label={item.label}
                textClassName={item.className}
              />
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

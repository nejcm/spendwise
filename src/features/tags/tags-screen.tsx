import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { Tag } from './types';
import * as React from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { FocusAwareStatusBar, getPressedStyle, Text } from '@/components/ui';
import { Plus } from '@/components/ui/icon';
import { ModalSheet } from '@/components/ui/modal-sheet';
import { translate } from '@/lib/i18n';
import { defaultStyles } from '@/lib/theme/styles';
import { useTags } from './hooks';
import { TagForm } from './tag-form';

export function TagsScreen() {
  const { data: tags = [] } = useTags();
  const [selected, setSelected] = React.useState<Tag | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const sheetRef = React.useRef<BottomSheetModal>(null);

  const openAdd = () => {
    setSelected(null);
    setSheetOpen(true);
    sheetRef.current?.present();
  };

  const openEdit = (tag: Tag) => {
    setSelected(tag);
    setSheetOpen(true);
    sheetRef.current?.present();
  };

  const closeSheet = () => {
    sheetRef.current?.dismiss();
    setSheetOpen(false);
    setSelected(null);
  };

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1">
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id}
          style={defaultStyles.transparentBg}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
          ListEmptyComponent={() => (
            <View className="mt-8 px-4">
              <Text className="text-center text-sm text-muted-foreground">
                {translate('tags.no_tags')}
              </Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <Pressable
              className="mb-3 flex-row items-center gap-2 rounded-xl bg-card px-4 py-3"
              style={getPressedStyle}
              onPress={openAdd}
            >
              <Plus size={18} colorClassName="accent-primary" />
              <Text className="text-sm font-medium text-primary">{translate('tags.add')}</Text>
            </Pressable>
          )}
          renderItem={({ item }) => (
            <Pressable
              className="mb-2 flex-row items-center gap-3 rounded-xl bg-card px-4 py-3"
              style={getPressedStyle}
              onPress={() => openEdit(item)}
            >
              <View className="size-4 rounded-full" style={{ backgroundColor: item.color }} />
              <Text className="flex-1 text-sm font-medium text-foreground">{item.name}</Text>
            </Pressable>
          )}
        />
      </View>

      <ModalSheet
        ref={sheetRef}
        onDismiss={closeSheet}
        title={(
          <Text className="text-lg font-bold">
            {selected ? translate('tags.edit') : translate('tags.add')}
          </Text>
        )}
        snapPoints={['60%']}
        enableDynamicSizing
      >
        {sheetOpen && (
          <TagForm
            tag={selected ?? undefined}
            onSuccess={closeSheet}
            onCancel={closeSheet}
          />
        )}
      </ModalSheet>
    </>
  );
}
